namespace CarnitasTaoTao.Core.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty; // NUEVO: Para el correo real
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = "Admin"; // Admin, Vendedor
    public bool Activo { get; set; } = true;
    public bool EsCorreoValidado { get; set; } = false; // NUEVO: Evita cuentas falsas
    public string? TokenVerificacion { get; set; } // NUEVO: Código enviado al correo
}