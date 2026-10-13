package shop

@RequestMapping("/api/invoices")
interface InvoiceApi {
    fun find(id: String): String
}
