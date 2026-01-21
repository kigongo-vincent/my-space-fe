import { useTheme } from "../../store/Themestore"

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
      className="flex flex-col gap-2 p-4"
      style={{
        backgroundColor: current?.foreground,
        borderRadius: "0.5rem",
      }}
    >
      <Skeleton width="100%" height="120px" rounded />
      <Skeleton width="80%" height="1rem" />
      <Skeleton width="60%" height="0.75rem" />
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
      <Skeleton width="48px" height="48px" rounded />
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
