class SearchState {
  query = $state('');
  focused = $state(false);

  clear() {
    this.query = '';
  }
}

export const searchState = new SearchState();