import Vue from 'vue'

declare module '*.vue' {
  export default Vue
}

declare module 'vue/types/vue' {
  interface Vue {
    $http: any,
    $db: any,
    $mixClient: any,
    $notifications: any,
    $settings: any,
    $ipfsClient: any,
    $activeAccount: any,
    $isDesktop: boolean,
  }
}

interface Blob {
  arrayBuffer(): Promise<ArrayBuffer>
}
