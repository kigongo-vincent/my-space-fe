import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Select from "../base/Select"

interface PaginationProps {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (limit: number) => void
}

const Pagination = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange
}: PaginationProps) => {
    const { current } = useTheme()

    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
        <View
            className="flex items-center justify-between p-4"
            style={{
                backgroundColor: current?.foreground,
                borderRadius: '0.25rem'
            }}
        >
            <View className="flex items-center gap-6">
                <Text
                    value={`Showing ${startItem}-${endItem} of ${totalItems}`}
                    style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }}
                />
                <View className="flex items-center gap-2">
                    <Text value="Items per page:" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                    <Select
                        value={itemsPerPage}
                        onChange={(value) => onItemsPerPageChange(Number(value))}
                        options={[
                            { value: 10, label: "10" },
                            { value: 25, label: "25" },
                            { value: 50, label: "50" },
                            { value: 100, label: "100" }
                        ]}
                        className="w-20"
                    />
                </View>
            </View>

            <View className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.25rem',
                        backgroundColor: currentPage === 1 ? 'transparent' : current?.background,
                        color: current?.dark
                    }}
                    title="Previous"
                >
                    <ChevronLeft size={18} color={current?.dark} />
                </button>

                <View className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                            pageNum = i + 1
                        } else if (currentPage <= 3) {
                            pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                        } else {
                            pageNum = currentPage - 2 + i
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className="transition-all"
                                style={{
                                    width: '2rem',
                                    height: '2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: currentPage === pageNum ? current?.primary : current?.background,
                                    color: currentPage === pageNum ? "#ffffff" : current?.dark,
                                    borderRadius: '0.25rem',
                                    fontSize: '1rem',
                                    fontWeight: currentPage === pageNum ? 500 : 400
                                }}
                            >
                                {pageNum}
                            </button>
                        )
                    })}
                </View>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.25rem',
                        backgroundColor: currentPage === totalPages ? 'transparent' : current?.background,
                        color: current?.dark
                    }}
                    title="Next"
                >
                    <ChevronRight size={18} color={current?.dark} />
                </button>
            </View>
        </View>
    )
}

export default Pagination
