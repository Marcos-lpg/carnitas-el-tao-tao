namespace CarnitasTaoTao.Core.DTOs
{
    public class VentaDto
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Total { get; set; }
        
        public string? DescripcionPedido { get; set; }
        public string? NombreCliente { get; set; }
        public string? DireccionEnvio { get; set; }
        public string? EstadoPago { get; set; }
        public string? MetodoPago { get; set; } // <-- Asegúrate de incluirlo

        public List<DetalleVentaDto> Detalles { get; set; } = new();
    }

    public class CrearVentaDto
    {
        public string? DescripcionPedido { get; set; }
        public decimal Total { get; set; }
        public string? NombreCliente { get; set; }
        public string? DireccionEnvio { get; set; }
        public string? EstadoPago { get; set; } = "Pagado";
        public string? MetodoPago { get; set; } = "Efectivo"; // <-- Asegúrate de incluirlo aquí también

        public List<DetalleVentaDto>? Detalles { get; set; }
    }

    public class DetalleVentaDto
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal => Cantidad * PrecioUnitario;
    }
}