/*
  This is essentially just a simple clone of the basic redux example included on the redux homepage:
  http://redux.js.org/

  For more details, visit that site or contact me (Zak).
*/

const redux = require('redux');

/*
  // STEP 1: Establish the storage for Redux.

  You can think of the store in redux as basically a variable in JavaScript. The difference between
*/
const numberStore = redux.createStore(function(state, action) {
  // Just log the incoming action
  console.log('Action just came in:', action);

  // Step 2:
  // Setup some default values or structure for our state
  // By default when we setup a new store in redux, our state will be undefined. For this particular
  if(state === undefined) {
    state = 0;
  }

  //
  if(action.type === 'INCREMENT') {
    return state + 1;
  }

  if(action.type === 'DECREMENT') {
    return state - 1;
  }

  if(action.type === 'INCREMENT_BY') {
    return state + action.incrementByThis;
  }

  return state;
});

numberStore.subscribe(() => {
  console.log('My state just changed!', numberStore.getState());
});

numberStore.dispatch({ type: 'INCREMENT' });

numberStore.dispatch({ type: 'INCREMENT_BY', incrementByThis: 3 });

numberStore.dispatch({ type: 'DECREMENT' });
