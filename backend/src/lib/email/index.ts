import sgMail from "@sendgrid/mail";

let inicializado = false;

function clienteSendgrid() {
  if (!inicializado) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error("Falta SENDGRID_API_KEY en el entorno.");
    sgMail.setApiKey(apiKey);
    inicializado = true;
  }
  return sgMail;
}

interface EnviarCorreoParams {
  para: string;
  asunto: string;
  html: string;
}

export async function enviarCorreo({ para, asunto, html }: EnviarCorreoParams): Promise<void> {
  const remitente = process.env.SENDGRID_FROM_EMAIL;
  if (!remitente) throw new Error("Falta SENDGRID_FROM_EMAIL en el entorno.");

  await clienteSendgrid().send({ to: para, from: remitente, subject: asunto, html });
}

export async function enviarCorreoRecuperacion(para: string, enlace: string): Promise<void> {
  await enviarCorreo({
    para,
    asunto: "Restablece tu contraseña",
    html: `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${enlace}">Haz clic aquí para crear una nueva contraseña</a></p>
      <p>Si no fuiste tú, ignora este correo. El enlace vence en 1 hora.</p>
    `,
  });
}

export async function enviarCorreoInvitacion(para: string, enlace: string): Promise<void> {
  await enviarCorreo({
    para,
    asunto: "Te invitaron a la plataforma de formación",
    html: `
      <p>Se creó una cuenta para ti en la plataforma de formación.</p>
      <p><a href="${enlace}">Haz clic aquí para crear tu contraseña</a></p>
      <p>El enlace vence en 7 días.</p>
    `,
  });
}
