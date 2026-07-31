using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net;
using System.Net.Mail;
using CarnitasTaoTao.Core.Data;
using CarnitasTaoTao.Core.Entities;

namespace CarnitasTaoTao.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UsuarioDto model)
        {
            if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario == model.NombreUsuario || u.Correo == model.Correo))
            {
                return BadRequest(new { message = "El nombre de usuario o el correo ya están en uso." });
            }

            var codigoVerificacion = new Random().Next(100000, 999999).ToString();

            var usuario = new Usuario
            {
                NombreUsuario = model.NombreUsuario,
                Correo = model.Correo,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Rol = model.Rol ?? "Admin",
                EsCorreoValidado = false,
                TokenVerificacion = codigoVerificacion
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            try
            {
                var smtpServer = _configuration["EmailSettings:Server"];
                var smtpPort = int.Parse(_configuration["EmailSettings:Port"]!);
                var senderEmail = _configuration["EmailSettings:SenderEmail"]!;
                var senderPassword = _configuration["EmailSettings:SenderPassword"]!;

                using var client = new SmtpClient(smtpServer, smtpPort)
                {
                    Credentials = new NetworkCredential(senderEmail, senderPassword),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, "Carnitas El Tao Tao"),
                    Subject = "Código de Verificación de Cuenta",
                    Body = $"<h3>Hola, {model.NombreUsuario}</h3><p>Tu código de verificación para Carnitas El Tao Tao es: <b style='font-size: 20px; color: #d97706;'>{codigoVerificacion}</b></p>",
                    IsBodyHtml = true
                };

                mailMessage.To.Add(model.Correo);
                await client.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al enviar el correo de verificación: " + ex.Message });
            }

            return Ok(new { message = "Usuario registrado exitosamente. Por favor verifica tu correo." });
        }

        [HttpPost("verificar-correo")]
        public async Task<IActionResult> VerificarCorreo([FromBody] VerificacionDto model)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == model.Correo && u.TokenVerificacion == model.Codigo);
            
            if (usuario == null)
            {
                return BadRequest(new { message = "Código de verificación inválido o correo incorrecto." });
            }

            usuario.EsCorreoValidado = true;
            usuario.TokenVerificacion = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Correo verificado correctamente. Ya puedes iniciar sesión." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UsuarioDto model)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == model.NombreUsuario);
            
            if (usuario == null)
            {
                return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
            }

            bool passwordValid = BCrypt.Net.BCrypt.Verify(model.Password, usuario.PasswordHash);
            if (!passwordValid)
            {
                return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
            }

            if (!usuario.EsCorreoValidado)
            {
                return BadRequest(new { message = "Tu cuenta no está verificada. Revisa tu correo electrónico para activarla." });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:Secret"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, usuario.NombreUsuario),
                    new Claim(ClaimTypes.Role, usuario.Rol)
                }),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _configuration["JwtSettings:Issuer"],
                Audience = _configuration["JwtSettings:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new { token = tokenString, usuario = usuario.NombreUsuario, rol = usuario.Rol });
        }
    }

    public class UsuarioDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("nombreUsuario")]
        public string NombreUsuario { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("correo")]
        public string Correo { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("password")]
        public string Password { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("rol")]
        public string? Rol { get; set; }
    }

    public class VerificacionDto
    {
        public string Correo { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
    }
}