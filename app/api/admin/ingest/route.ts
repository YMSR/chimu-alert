import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const REQUIRED_COLUMNS = [
  "date",
  "deceased_name",
  "related_names",
  "region",
  "age",
  "source_url",
];

type CsvRecord = Record<string, string>;

type NormalizedRow = {
  publishedOn: Date;
  deceasedName: string;
  region: string;
  age: number | null;
  sourceUrl: string;
  relatedNames: string[];
};

type Failure = {
  line: number;
  error: string;
};

function parseRelatedNames(raw: string) {
  return raw
    .split(/[;,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function validateColumns(records: CsvRecord[]) {
  if (records.length === 0) {
    return true;
  }

  const headers = new Set(Object.keys(records[0]));
  return REQUIRED_COLUMNS.every((column) => headers.has(column));
}

function normalizeRow(record: CsvRecord, line: number): NormalizedRow | Failure {
  for (const column of REQUIRED_COLUMNS) {
    if (!record[column] || record[column].trim().length === 0) {
      return { line, error: `列 ${column} が空です` };
    }
  }

  const publishedOn = new Date(record.date);
  if (Number.isNaN(publishedOn.getTime())) {
    return { line, error: "日付の形式が不正です" };
  }

  const ageValue = record.age.trim();
  const age = ageValue.length === 0 ? null : Number.parseInt(ageValue, 10);
  if (ageValue.length > 0 && Number.isNaN(age)) {
    return { line, error: "年齢の形式が不正です" };
  }

  if (!URL.canParse(record.source_url)) {
    return { line, error: "source_url が不正です" };
  }

  const relatedNames = parseRelatedNames(record.related_names);

  return {
    publishedOn,
    deceasedName: record.deceased_name.trim(),
    region: record.region.trim(),
    age,
    sourceUrl: record.source_url.trim(),
    relatedNames,
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSVファイルを選択してください" }, { status: 400 });
  }

  const contents = await file.text();
  if (!contents.trim()) {
    return NextResponse.json({ error: "空のファイルです" }, { status: 400 });
  }

  let records: CsvRecord[] = [];
  try {
    records = parse(contents, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRecord[];
  } catch {
    return NextResponse.json({ error: "CSVの解析に失敗しました" }, { status: 400 });
  }

  if (!validateColumns(records)) {
    return NextResponse.json(
      { error: `必須列が不足しています。必要な列: ${REQUIRED_COLUMNS.join(", ")}` },
      { status: 400 },
    );
  }

  const failures: Failure[] = [];
  let imported = 0;

  for (let index = 0; index < records.length; index += 1) {
    const line = index + 2; // header row + 1-based index
    const normalized = normalizeRow(records[index], line);

    if ("error" in normalized) {
      failures.push(normalized);
      continue;
    }

    try {
      await prisma.obituary.create({
        data: {
          publishedOn: normalized.publishedOn,
          deceasedName: normalized.deceasedName,
          region: normalized.region,
          age: normalized.age,
          sourceUrl: normalized.sourceUrl,
          relatedNames: normalized.relatedNames,
        },
      });
      imported += 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        failures.push({ line, error: "source_url が既に登録されています" });
      } else {
        failures.push({ line, error: "保存中にエラーが発生しました" });
      }
    }
  }

  return NextResponse.json({
    total: records.length,
    imported,
    failed: failures.length,
    failures,
  });
}
