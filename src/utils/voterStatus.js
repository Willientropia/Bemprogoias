export function getVoterSyncStatus(voter = {}) {
  if (voter?.syncStatus === 'pending' && voter?.syncErrorMessage) {
    return { text: 'Falha no envio', className: 'failed', icon: 'alert' };
  }
  if (voter.syncStatus === 'conflict') return { text: 'Conflito', className: 'conflict', icon: 'alert' };
  if (voter.syncStatus === 'pending') return { text: 'Pendente', className: 'pending', icon: 'sync' };
  if (voter.syncStatus === 'local_only') return { text: 'Neste aparelho', className: 'local', icon: 'phone' };
  return { text: 'Sincronizado', className: 'synced', icon: 'check' };
}
