class SyncModalState {
  isOpen = $state(false);

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }
}

export const syncModalState = new SyncModalState();
