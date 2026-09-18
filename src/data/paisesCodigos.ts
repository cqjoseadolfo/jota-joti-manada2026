export interface PaisCodigo {
  codigoIso: string;
  nombre: string;
  dialCode: string;
  flag: string;
  ejemplo: string;
}

export const PAISES_CODIGOS: PaisCodigo[] = [
  { codigoIso: 'PE', nombre: 'Perú', dialCode: '+51', flag: '🇵🇪', ejemplo: '987654321' },
  { codigoIso: 'AR', nombre: 'Argentina', dialCode: '+54', flag: '🇦🇷', ejemplo: '91123456789' },
  { codigoIso: 'BO', nombre: 'Bolivia', dialCode: '+591', flag: '🇧🇴', ejemplo: '71234567' },
  { codigoIso: 'BR', nombre: 'Brasil', dialCode: '+55', flag: '🇧🇷', ejemplo: '11987654321' },
  { codigoIso: 'CL', nombre: 'Chile', dialCode: '+56', flag: '🇨🇱', ejemplo: '912345678' },
  { codigoIso: 'CO', nombre: 'Colombia', dialCode: '+57', flag: '🇨🇴', ejemplo: '3001234567' },
  { codigoIso: 'CR', nombre: 'Costa Rica', dialCode: '+506', flag: '🇨🇷', ejemplo: '88888888' },
  { codigoIso: 'EC', nombre: 'Ecuador', dialCode: '+593', flag: '🇪🇨', ejemplo: '991234567' },
  { codigoIso: 'SV', nombre: 'El Salvador', dialCode: '+503', flag: '🇸🇻', ejemplo: '70123456' },
  { codigoIso: 'ES', nombre: 'España', dialCode: '+34', flag: '🇪🇸', ejemplo: '612345678' },
  { codigoIso: 'GT', nombre: 'Guatemala', dialCode: '+502', flag: '🇬🇹', ejemplo: '51234567' },
  { codigoIso: 'HN', nombre: 'Honduras', dialCode: '+504', flag: '🇭🇳', ejemplo: '91234567' },
  { codigoIso: 'MX', nombre: 'México', dialCode: '+52', flag: '🇲🇽', ejemplo: '5512345678' },
  { codigoIso: 'NI', nombre: 'Nicaragua', dialCode: '+505', flag: '🇳🇮', ejemplo: '81234567' },
  { codigoIso: 'PA', nombre: 'Panamá', dialCode: '+507', flag: '🇵🇦', ejemplo: '61234567' },
  { codigoIso: 'PY', nombre: 'Paraguay', dialCode: '+595', flag: '🇵🇾', ejemplo: '981234567' },
  { codigoIso: 'UY', nombre: 'Uruguay', dialCode: '+598', flag: '🇺🇾', ejemplo: '99123456' },
  { codigoIso: 'VE', nombre: 'Venezuela', dialCode: '+58', flag: '🇻🇪', ejemplo: '4121234567' },
  { codigoIso: 'US', nombre: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸', ejemplo: '2025550123' },
  { codigoIso: 'CA', nombre: 'Canadá', dialCode: '+1', flag: '🇨🇦', ejemplo: '4165550123' },
  { codigoIso: 'OT', nombre: 'Otro país', dialCode: '+', flag: '🌐', ejemplo: 'Número' },
];
