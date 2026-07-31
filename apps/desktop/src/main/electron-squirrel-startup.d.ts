declare module 'electron-squirrel-startup' {
  /** True when the process was launched by a Squirrel.Windows install event. */
  const startedViaSquirrel: boolean;
  export default startedViaSquirrel;
}
