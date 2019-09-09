
let activeAccount


function get() {
  return activeAccount;
}

function set(account) {
  activeAccount = account;
}

export default { get, set }
