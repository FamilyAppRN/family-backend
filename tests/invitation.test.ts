import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildInvitationEmail } from '../src/modules/household/application/services/invitationEmail.js';

describe('email de invitación', () => {
  const email = buildInvitationEmail({
    to: 'sofia@correo.com',
    inviterName: 'Ana <script>',
    householdName: 'Casa "Pérez"',
    inviteCode: '7F3A9C',
  });

  test('lleva el código y el enlace a la app', () => {
    assert.match(email.text, /7F3A9C/);
    assert.match(email.text, /gestia:\/\/join\?code=7F3A9C/);
    assert.match(email.html ?? '', /href="gestia:\/\/join\?code=7F3A9C"/);
  });

  test('escapa los nombres en el HTML', () => {
    assert.doesNotMatch(email.html ?? '', /<script>/);
    assert.match(email.html ?? '', /Ana &lt;script&gt;/);
    assert.match(email.html ?? '', /Casa &quot;Pérez&quot;/);
  });
});
