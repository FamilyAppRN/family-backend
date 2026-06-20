import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { ENV } from '../../../../config/env.js';

/**
 * PasswordService — Servicio de dominio para hashing seguro de contraseñas.
 *
 * Estrategia de hashing en dos fases:
 * 1. Pre-hash: SHA-256(email_normalizado + ":" + password_plano)
 *    → Garantiza que la misma contraseña en dos cuentas distintas produce inputs distintos.
 * 2. Hash final: bcrypt(pre-hash, salt_rounds)
 *    → bcrypt genera su propio salt aleatorio internamente, pero el pre-hash
 *      asegura unicidad incluso si dos usuarios comparten la misma contraseña.
 *
 * Los salt_rounds se almacenan en el documento del usuario para permitir
 * migraciones progresivas del costo de hashing sin invalidar contraseñas existentes.
 */

const DEFAULT_SALT_ROUNDS = 10;

export class PasswordService {

    /**
     * Genera el pre-hash combinando email + contraseña con SHA-256.
     * El email se normaliza a minúsculas y se recorta de espacios.
     */
    private static deriveInput(email: string, plainPassword: string): string {
        const normalizedEmail = email.toLowerCase().trim();
        return createHash('sha256')
            .update(`${normalizedEmail}:${plainPassword}`)
            .digest('hex');
    }

    /**
     * Hashea una contraseña para almacenamiento.
     * @returns {{ hash, saltRounds }} — El hash final y los rounds utilizados.
     */
    static async hash(
        email: string,
        plainPassword: string,
        saltRounds: number = DEFAULT_SALT_ROUNDS
    ): Promise<{ hash: string; saltRounds: number }> {
        const derived = this.deriveInput(email, plainPassword);
        const hash = await bcrypt.hash(derived, saltRounds);
        return { hash, saltRounds };
    }

    /**
     * Verifica una contraseña contra el hash almacenado.
     * Reconstruye el pre-hash con el email del usuario y lo compara con bcrypt.
     */
    static async verify(
        email: string,
        plainPassword: string,
        storedHash: string
    ): Promise<boolean> {
        const derived = this.deriveInput(email, plainPassword);
        return bcrypt.compare(derived, storedHash);
    }

    /**
     * Determina si el hash almacenado necesita ser re-hasheado
     * (por ejemplo, si los rounds guardados son menores a los actuales).
     * Útil para migración progresiva de seguridad.
     */
    static needsRehash(storedRounds: number): boolean {
        return storedRounds < DEFAULT_SALT_ROUNDS;
    }
}
