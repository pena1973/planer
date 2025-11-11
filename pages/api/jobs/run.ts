// pages/api/jobs/run.ts
import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/server/withAuth";
import { ulogger } from "@/lib/common/universal-logger";
import { jobs } from "@/job/jobs";

// type RunJobBody = {
//   job?: string;
//   params?: Record<string, any> | null;
// };
type RunJobBody = {
  job?: keyof typeof jobs;
  params?: Record<string, unknown> | null;
};

// Простая in-memory защита от параллельных запусков одной и той же job
const inFlight = new Set<string>();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Разрешаем только POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Тело запроса Next автоматически парсит при Content-Type: application/json
  const body = (req.body || {}) as RunJobBody;

  const jobKey = (body.job || "").trim();
  const params = body.params ?? null;

  if (!jobKey) {
    return res.status(400).json({ success: false, error: "Field 'job' is required" });
  }

  const jobFn = jobs[jobKey];
  if (typeof jobFn !== "function") {
    await ulogger.error({
      userId: null,
      location: "api/jobs/run",
      event: "not_found",
      message: `Unknown job: ${jobKey}`,
      context: "POST /api/jobs/run",
    });
    return res.status(404).json({ success: false, error: "Job not found" });
  }

  // Блокировка от одновременного запуска одной и той же job
  if (inFlight.has(jobKey)) {
    return res.status(423).json({ success: false, error: "Job is already running" }); // 423 Locked
  }

  inFlight.add(jobKey);

  try {
    // const maybePromise = jobFn(params);
    // if (maybePromise && typeof (maybePromise as any).then === "function") {
    //   await (maybePromise as Promise<void>);
    // }

    const result = jobFn(params);

    if (result instanceof Promise) {
      await result;
    }


    await ulogger.info({
      userId: null,
      location: "api/jobs/run",
      event: "ok",
      message: `job=${jobKey} executed`,
      context: "POST /api/jobs/run",
    });

    return res.status(200).json({
      success: true,
      message: `${jobKey} completed`,
    });
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e);

    await ulogger.error({
      userId: null,
      location: "api/jobs/run",
      event: "error",
      message: `job=${jobKey} failed: ${err}`,
      context: "POST /api/jobs/run",
    });

    return res.status(500).json({ success: false, error: err || "Job failed" });
  } finally {
    inFlight.delete(jobKey);
  }
};

export default withAuth(handler);
