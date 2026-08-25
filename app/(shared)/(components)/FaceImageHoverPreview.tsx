"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Camera, Loader2 } from "lucide-react";
import {
  getFaceImage,
  type FaceImageOwnerType,
  type FaceImageResponse,
} from "../(api)/faceImage";
import { queryKeys } from "../(api)/queryKeys";

interface FaceImageHoverPreviewProps {
  id: number;
  name: string;
  type: FaceImageOwnerType;
  hasFaceImage?: boolean;
  className?: string;
}

interface PreviewPosition {
  left: number;
  top: number;
}

const PREVIEW_WIDTH = 192;
const PREVIEW_HEIGHT = 232;
const VIEWPORT_MARGIN = 8;

export default function FaceImageHoverPreview({
  id,
  name,
  type,
  hasFaceImage,
  className = "",
}: FaceImageHoverPreviewProps) {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PreviewPosition | null>(null);

  const faceImageQuery = useQuery<FaceImageResponse | null>({
    queryKey: queryKeys.faceImage(type, id),
    queryFn: async () => {
      try {
        return await getFaceImage(type, id);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: isOpen && hasFaceImage !== false,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const openPreview = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - PREVIEW_WIDTH - VIEWPORT_MARGIN,
      Math.max(
        VIEWPORT_MARGIN,
        rect.left + rect.width / 2 - PREVIEW_WIDTH / 2
      )
    );
    const hasRoomBelow =
      window.innerHeight - rect.bottom >= PREVIEW_HEIGHT + VIEWPORT_MARGIN;
    const top = hasRoomBelow
      ? rect.bottom + VIEWPORT_MARGIN
      : Math.max(VIEWPORT_MARGIN, rect.top - PREVIEW_HEIGHT - VIEWPORT_MARGIN);

    setPosition({ left, top });
    setIsOpen(true);
  };

  const closePreview = () => setIsOpen(false);

  const preview =
    isOpen && position
      ? createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[100] w-48 animate-in fade-in zoom-in-95 rounded-xl border border-gray-200 bg-white p-2 shadow-xl duration-150"
            style={{ left: position.left, top: position.top }}
          >
            <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">
              {hasFaceImage === false || faceImageQuery.data === null ? (
                <div className="flex flex-col items-center gap-2 px-3 text-center">
                  <Camera className="h-8 w-8" />
                  <span className="text-xs">등록된 사진이 없습니다.</span>
                </div>
              ) : faceImageQuery.isError ? (
                <div className="flex flex-col items-center gap-2 px-3 text-center">
                  <Camera className="h-8 w-8" />
                  <span className="text-xs">사진을 불러오지 못했습니다.</span>
                </div>
              ) : faceImageQuery.data ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faceImageQuery.data.url}
                  alt={`${name} 얼굴 사진`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
            </div>
            <p className="truncate px-1 pb-1 pt-2 text-center text-sm font-semibold text-gray-800">
              {name}
            </p>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        tabIndex={0}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={(event) => openPreview(event.currentTarget)}
        onMouseLeave={closePreview}
        onFocus={(event) => openPreview(event.currentTarget)}
        onBlur={closePreview}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closePreview();
            event.currentTarget.blur();
          }
        }}
        className={`cursor-help rounded-sm underline-offset-4 hover:text-[#2C79FF] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E99FF] ${className}`}
      >
        {name}
      </span>
      {preview}
    </>
  );
}
