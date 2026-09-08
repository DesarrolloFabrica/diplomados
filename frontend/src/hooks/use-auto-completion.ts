"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { marcarLeccionCompletada } from "@backend/server/actions/progreso";

export const AUTO_COMPLETION_THRESHOLD = 0.85;
export const MIN_DOCUMENT_REVIEW_SECONDS = 8;

type ConsumptionRange = [start: number, end: number];

export interface MediaConsumptionSample {
  resourceId: string;
  start: number;
  end: number;
  duration: number;
  ended?: boolean;
}

export type MediaConsumptionReporter = (sample: MediaConsumptionSample) => void;

export type AutoCompletionStatus =
  | "watching"
  | "saving"
  | "completed"
  | "error";

interface UseAutoCompletionOptions {
  enabled: boolean;
  alreadyCompleted: boolean;
  courseId: string;
  enrollmentId: string;
  lessonId: string;
}

interface MediaConsumptionState {
  duration: number;
  ranges: ConsumptionRange[];
}

function mergeRanges(ranges: ConsumptionRange[]): ConsumptionRange[] {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: ConsumptionRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range[0] > previous[1] + 0.25) {
      merged.push([...range]);
      continue;
    }
    previous[1] = Math.max(previous[1], range[1]);
  }

  return merged;
}

function coveredSeconds(ranges: ConsumptionRange[]): number {
  return ranges.reduce((total, [start, end]) => total + Math.max(0, end - start), 0);
}

export function useAutoCompletion({
  enabled,
  alreadyCompleted,
  courseId,
  enrollmentId,
  lessonId,
}: UseAutoCompletionOptions) {
  const router = useRouter();
  const [status, setStatus] = useState<AutoCompletionStatus>(
    alreadyCompleted ? "completed" : "watching",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const completionTriggeredRef = useRef(alreadyCompleted);
  const mediaStateRef = useRef(new Map<string, MediaConsumptionState>());
  const lessonKey = `${courseId}:${enrollmentId}:${lessonId}`;
  const lessonKeyRef = useRef(lessonKey);

  useEffect(() => {
    if (lessonKeyRef.current !== lessonKey) {
      lessonKeyRef.current = lessonKey;
      mediaStateRef.current.clear();
      completionTriggeredRef.current = alreadyCompleted;
      setErrorMessage(null);
      setJustCompleted(false);
      setStatus(alreadyCompleted ? "completed" : "watching");
      return;
    }

    if (alreadyCompleted) {
      completionTriggeredRef.current = true;
      setStatus("completed");
    }
  }, [alreadyCompleted, lessonKey]);

  useEffect(() => {
    if (!justCompleted) return undefined;
    const timeoutId = window.setTimeout(() => setJustCompleted(false), 800);
    return () => window.clearTimeout(timeoutId);
  }, [justCompleted]);

  const requestCompletion = useCallback(async () => {
    if (!enabled || alreadyCompleted || completionTriggeredRef.current) return;

    completionTriggeredRef.current = true;
    setStatus("saving");
    setErrorMessage(null);

    try {
      const result = await marcarLeccionCompletada(courseId, enrollmentId, lessonId);
      if (!result.ok) {
        setStatus("error");
        setErrorMessage(result.mensaje ?? "No se pudo guardar el progreso.");
        return;
      }

      setStatus("completed");
      setJustCompleted(true);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("No se pudo guardar el progreso. Revisa tu conexion.");
    }
  }, [alreadyCompleted, courseId, enabled, enrollmentId, lessonId, router]);

  const registerMediaProgress = useCallback<MediaConsumptionReporter>(
    ({ resourceId, start, end, duration }) => {
      if (!enabled || alreadyCompleted || completionTriggeredRef.current) return;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const boundedStart = Math.max(0, Math.min(start, duration));
      const boundedEnd = Math.max(0, Math.min(end, duration));
      if (boundedEnd <= boundedStart) return;

      const previous = mediaStateRef.current.get(resourceId);
      const ranges = mergeRanges([
        ...(previous?.ranges ?? []),
        [boundedStart, boundedEnd],
      ]);
      mediaStateRef.current.set(resourceId, { duration, ranges });

      if (coveredSeconds(ranges) / duration >= AUTO_COMPLETION_THRESHOLD) {
        void requestCompletion();
      }
    },
    [alreadyCompleted, enabled, requestCompletion],
  );

  const registerDocumentEnd = useCallback(() => {
    if (!enabled || alreadyCompleted || completionTriggeredRef.current) return;
    void requestCompletion();
  }, [alreadyCompleted, enabled, requestCompletion]);

  const retry = useCallback(() => {
    if (status !== "error" || alreadyCompleted) return;
    completionTriggeredRef.current = false;
    void requestCompletion();
  }, [alreadyCompleted, requestCompletion, status]);

  return {
    status,
    errorMessage,
    justCompleted,
    trackingEnabled: enabled && !alreadyCompleted && status === "watching",
    registerMediaProgress,
    registerDocumentEnd,
    retry,
  };
}

export function useMediaRangeTracking(
  mediaRef: RefObject<HTMLMediaElement | null>,
  resourceId: string,
  enabled: boolean,
  reportProgress?: MediaConsumptionReporter,
) {
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !enabled || !reportProgress) return undefined;
    const trackedMedia: HTMLMediaElement = media;
    const reporter = reportProgress;

    let playing = !trackedMedia.paused;
    let seeking = false;
    let lastTime: number | null = playing ? trackedMedia.currentTime : null;

    function reportCurrentRange(ended = false) {
      const currentTime = trackedMedia.currentTime;
      const duration = trackedMedia.duration;
      if (
        !playing ||
        seeking ||
        lastTime === null ||
        !Number.isFinite(currentTime) ||
        !Number.isFinite(duration)
      ) {
        return;
      }

      if (currentTime > lastTime) {
        reporter({
          resourceId,
          start: lastTime,
          end: currentTime,
          duration,
          ended,
        });
      }
      lastTime = currentTime;
    }

    function handlePlay() {
      playing = true;
      seeking = false;
      lastTime = trackedMedia.currentTime;
    }

    function handlePause() {
      reportCurrentRange();
      playing = false;
      lastTime = null;
    }

    function handleTimeUpdate() {
      reportCurrentRange();
    }

    function handleSeeking() {
      seeking = true;
      lastTime = null;
    }

    function handleSeeked() {
      seeking = false;
      playing = !trackedMedia.paused;
      lastTime = playing ? trackedMedia.currentTime : null;
    }

    function handleEnded() {
      reportCurrentRange(true);
      playing = false;
      lastTime = null;
    }

    trackedMedia.addEventListener("play", handlePlay);
    trackedMedia.addEventListener("pause", handlePause);
    trackedMedia.addEventListener("timeupdate", handleTimeUpdate);
    trackedMedia.addEventListener("seeking", handleSeeking);
    trackedMedia.addEventListener("seeked", handleSeeked);
    trackedMedia.addEventListener("ended", handleEnded);

    return () => {
      trackedMedia.removeEventListener("play", handlePlay);
      trackedMedia.removeEventListener("pause", handlePause);
      trackedMedia.removeEventListener("timeupdate", handleTimeUpdate);
      trackedMedia.removeEventListener("seeking", handleSeeking);
      trackedMedia.removeEventListener("seeked", handleSeeked);
      trackedMedia.removeEventListener("ended", handleEnded);
    };
  }, [enabled, mediaRef, reportProgress, resourceId]);
}
