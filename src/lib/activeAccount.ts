
let activeAccount: any


function get() {
  return activeAccount;
}

function set(account: any) {
  activeAccount = account;
}

export default { get, set }
