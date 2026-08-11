const DB_NAME = 'bem-pro-goias-campo';
const DB_VERSION = 1;
const VOTERS = 'voters';
const META = 'meta';

let databasePromise;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transação local cancelada.'));
  });
}

function openDatabase() {
  if (!('indexedDB' in globalThis)) {
    return Promise.reject(new Error('Este navegador não oferece armazenamento offline.'));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(VOTERS)) {
          const store = database.createObjectStore(VOTERS, { keyPath: 'id' });
          store.createIndex('ownerKey', 'ownerKey', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('rgNormalized', 'rgNormalized', { unique: false });
          store.createIndex('tituloNormalized', 'tituloNormalized', { unique: false });
        }
        if (!database.objectStoreNames.contains(META)) {
          database.createObjectStore(META, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

function ownerKey(campaignId, leaderId) {
  return `${campaignId}:${leaderId}`;
}

export const localStore = {
  async listVoters(campaignId, leaderId, { includeDeleted = false } = {}) {
    const database = await openDatabase();
    const transaction = database.transaction(VOTERS, 'readonly');
    const index = transaction.objectStore(VOTERS).index('ownerKey');
    const records = await requestResult(index.getAll(ownerKey(campaignId, leaderId)));
    await transactionDone(transaction);
    return records
      .filter((record) => includeDeleted || !record._deleted)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  },

  async getVoter(id) {
    const database = await openDatabase();
    const transaction = database.transaction(VOTERS, 'readonly');
    const record = await requestResult(transaction.objectStore(VOTERS).get(id));
    await transactionDone(transaction);
    return record;
  },

  async putVoter(record) {
    const database = await openDatabase();
    const transaction = database.transaction(VOTERS, 'readwrite');
    transaction.objectStore(VOTERS).put({
      ...record,
      ownerKey: ownerKey(record.campaignId, record.leaderId)
    });
    await transactionDone(transaction);
    return record;
  },

  async deleteVoter(id) {
    const database = await openDatabase();
    const transaction = database.transaction(VOTERS, 'readwrite');
    transaction.objectStore(VOTERS).delete(id);
    await transactionDone(transaction);
  },

  async pendingVoters(campaignId, leaderId) {
    const records = await this.listVoters(campaignId, leaderId, { includeDeleted: true });
    return records.filter((record) => record.syncStatus === 'pending');
  },

  async findDuplicate({ campaignId, rgNormalized, tituloNormalized, excludeId }) {
    const database = await openDatabase();
    const transaction = database.transaction(VOTERS, 'readonly');
    const store = transaction.objectStore(VOTERS);
    const candidates = [];
    if (rgNormalized) candidates.push(...await requestResult(store.index('rgNormalized').getAll(rgNormalized)));
    if (tituloNormalized) candidates.push(...await requestResult(store.index('tituloNormalized').getAll(tituloNormalized)));
    await transactionDone(transaction);
    return candidates.find((record) =>
      !record._deleted && record.campaignId === campaignId && record.id !== excludeId
    );
  },

  async setMeta(key, value) {
    const database = await openDatabase();
    const transaction = database.transaction(META, 'readwrite');
    transaction.objectStore(META).put({ key, value });
    await transactionDone(transaction);
  },

  async getMeta(key) {
    const database = await openDatabase();
    const transaction = database.transaction(META, 'readonly');
    const result = await requestResult(transaction.objectStore(META).get(key));
    await transactionDone(transaction);
    return result?.value;
  }
};
