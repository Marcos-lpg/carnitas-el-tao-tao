namespace CarnitasTaoTao.Core.Entities
{
    public class Venta
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Total { get; set; }
        
        // Nuevos campos agregados
        public string? DescripcionPedido { get; set; }
        public string? NombreCliente { get; set; }
        public string? DireccionEnvio { get; set; }
        public string? EstadoPago { get; set; }
        public string? MetodoPago { get; set; } // <-- Agrégalo aquí
public int CajaTurnoId { get; set; }
public CajaTurno? CajaTurno { get; set; }
        public ICollection<DetalleVenta> Detalles { get; set; } = new List<DetalleVenta>();
    }
}