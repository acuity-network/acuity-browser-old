declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

interface Blob {
  arrayBuffer(): Promise<ArrayBuffer>;
}
