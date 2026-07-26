export interface PersistedAMFashionState {
  
}

export const getPersistedAMFashionState = (): PersistedAMFashionState => {
  try {
    return localStorage['AM-Fashion'] ? JSON.parse(localStorage['AM-Fashion']) : {};
  } catch (error) {
    return {};
  }
};

export const savePersistedAMFashionState = (partialState: PersistedAMFashionState) => {
  const prevState = getPersistedAMFashionState();
  localStorage.setItem('AM-Fashion', JSON.stringify({ ...prevState, ...partialState }));
};
