let db;
// create a new db request for a "BudgetDB" database.
let budgetVersion;
const request = window.indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (event) {
  // create object store called "BudgetStore" and set autoIncrement to true
  console.log('Upgrade needed in IndexDB');
  // Check the version property
  const { oldVersion } = event;
  // If there was an upgrade we can see that here.
  const newVersion = event.newVersion || db.version;
  // Log the Versions
  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);
  // Get an instance of the DB
  db = event.target.result;
  //If there are no stores in the DB, add the new store to this version and set it to create unique id's in the KeyPath
  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(request.error);
};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const budgetStore = transaction.objectStore("BudgetStore");
  // add record to your store with add method.
  budgetStore.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const budgetStore = transaction.objectStore("BudgetStore");
  // get all records from store and set to a variable
  const getAll = budgetStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // if successful, open a transaction on your pending db
          if (res.length !== 0) {
            const transaction = db.transaction(["BudgetStore"], "readwrite");
            // access your pending object store
            const budgetStore = transaction.objectStore("BudgetStore");
            // clear all items in your store
            budgetStore.clear();
          }
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
