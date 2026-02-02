import { useTheme } from "../../store/Themestore"

const FolderSkeletonSvg = ({ size = 64 }: { size?: number }) => {
  const { current } = useTheme()
  const fill = current?.dark + "12"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 56"
      fill="none"
      className="animate-pulse"
    >
      {/* Open folder: tab + body, no border */}
      <path
        d="M6 18 L6 14 C6 10 10 8 14 8 L26 8 L30 12 L54 12 C58 12 58 16 58 18 L58 48 C58 52 54 54 50 54 L14 54 C10 54 6 52 6 48 Z"
        fill={fill}
      />
    </svg>
  )
}

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
  count?: number
}

export const Skeleton = ({
  className = "",
  width,
  height,
  rounded = false,
  count = 1,
}: SkeletonProps) => {
  const { current } = useTheme()

  const style: React.CSSProperties = {
    backgroundColor: current?.dark + "10",
    width: width || "100%",
    height: height || "1rem",
    borderRadius: rounded ? "50%" : "0.25rem",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  }

  if (count === 1) {
    return <div className={className} style={style} />
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={className} style={style} />
      ))}
    </>
  )
}

export const FileItemSkeleton = () => {
  const { current } = useTheme()

  return (
    <div
      className="flex flex-col items-center gap-2 p-4"
      style={{
        backgroundColor: current?.foreground,
        borderRadius: "0.5rem",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: "10vh", height: "10vh" }}
      >
        <FolderSkeletonSvg size={80} />
      </div>
      <Skeleton width="80%" height="0.75rem" />
      <Skeleton width="60%" height="0.6rem" />
    </div>
  )
}

export const ListItemSkeleton = () => {
  const { current } = useTheme()

  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{
        backgroundColor: current?.foreground,
        borderRadius: "0.5rem",
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 48, height: 48 }}
      >
        <FolderSkeletonSvg size={48} />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
  )
}

export const DiskSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <FileItemSkeleton key={i} />
      ))}
    </div>
  )
}
