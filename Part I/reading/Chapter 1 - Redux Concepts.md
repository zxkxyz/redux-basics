## Chapter 1: Let's Build A State Manager

The opening line in the Redux documentation is as such:

>Redux is a predictable state container for JavaScript apps.

This one line essentially clears up a misconception I've seen around Redux before: It's not a state replacement for React and it's not a React-specific library, it's just a library for storing state-like information. From a high level you can kind of think of it as a variable with events. I.e, we can listen to changes in our state and invoke functions accordingly. The power of redux is its simplicity, we can very easily control when and how we'd like to update our state.

In order to really illustrate both the power and simplicity of Redux, let's write our own state management system using plain old JavaScript :) For example, if we wanted to use a regular JavaScript object to store a counter, we could write something like this:

```javascript
// This object represents our state
var state = { num: 0 };

// Now we modify the state
state.num++;
state.num++;
state.num--;

// And voila! Our state has updated!
console.log(state.num) // 1
```

Now this is a perfectly valid method for storing information, right? But now let's introduce a new piece of functionality for our application. Let's say we want to display that number on a browser. Well, we can develop a render function to do that for us:

```javascript
function renderNumber(number) {
	// Assuming that our HTML contains the 'numberView' element
	document.getElementById('numberView').innerHTML = number;
}
```

If we wanted to re-render our number every time it's updated in state, we'd have to manually call the `renderNumber` function whenever we modify the number in our state:

```javascript
// function renderNumber() { ... }

var state = { num: 0 };
renderNumber(state.num);

state.num++;
// Manually re-render the DOM on state change
renderNumber(state.num);
state.num++;
renderNumber(state.num);
state.num--;
renderNumber(state.num);

console.log(state.num) // 1
```

You might already be able to tell but this is going to get messy and confusing very fast. Imagine now we want to re-render something else whenever the number update, such as a counter that represents the total number of changes we've made to our state number.

So there's a very obvious way to refactor this code to make it a bit cleaner, we could just make a function that both changes our number property and then re-renders our numberView element:

```javascript
// function renderNumber() { ... }

var state = { num: 0 };

function updateNumber(newNumber) {
	state.num = newNumber;
	renderNumber(state.num);
}

// Calling this function will in turn re-render the number
updateNumber(state.num + 3);
updateNumber(state.num - 2);

console.log(state.num) // 1
```

In fact, we can refactor to make a generic function that updates any property in our store. That way we'll have a single method for triggering any sort of update to our state.

```javascript
// function renderNumber() { ... }

var state = { num: 0 };

function updateState(property, newValue) {
	state[property] = newValue;
	renderNumber(state.num);
}

updateState('num', state.num + 3);
updateState('num', state.num - 2);

console.log(state.num) // 1
```

There's another glaring issue with this code though, we've hardcoded calling the `renderNumber` method in our updateState function. However we can't predict what other functions and re-renders we might need to perform in addition to re-rendering the  numberView element. Ideally what we want is for us to dynamically control which functions should be invoked whenever our state updates. So, we can implement an array of functions to invoke whenever state updates:

```javascript
// function renderNumber() { ... }

var state = { num: 0 };
var listeners = [];

function updateState(property, newValue) {
	state[property] = newValue;
	listeners.forEach(function(listener) {
		listener();
	});
}

function subscribeToState(listener) {
	listeners.push(listener);
}

subscribeToState(renderNumber);
subscribeToState(function() {
	console.log("Our state updated!");
});

updateState('num', state.num + 3);
updateState('num', state.num - 2);

console.log(state.num) // 1
```

In the above example, whenever I trigger the updateState function, I'm also triggering the `renderNumber` function and an anonymous function I declared that just logs "Our state updated!" (it should log twice above) whenever our state updates.

If you're thinking about eventing systems right now, you're on the right track. Essentially what we've just done is introduce a basic eventing system into our state manager. I.e, whenever we update state we're triggering an event that has listeners associated with it. At this point in our state manager, we're in a position to add as many listeners as we want. Any time we want to perform some function when the state updates, we just add that function to our `listeners` array using our `subscribeToState` function and we're all good.

There's a few more changes we're going to make though. At the moment our `updateState` function is hardcoded to just replace a property in our state. This is problematic because we're really limited in how we can update our state. For example, the current `updateState` method is only designed to change a single property in our state. What if we wanted to change multiple properties at once? Or maybe we don't even want to update a property at all, maybe we want to delete a property from our state? At the moment this just isn't possible because we've hardcoded the behavior of updating the state. Ideally we'd want our developer to choose exactly how to modify the state of our app given certain situations.

Of course one way we could do that is by changing our `updateState` function to accept a function wherein we return a new state:

```javascript
var state = { num: 0, name: '', age: null };
var listeners = [];

function updateState(stateModifier) {
	state = stateModifier(state);
	listeners.forEach(function(listener) {
		listener();
	});
}

function subscribeToState(listener) {
	listeners.push(listener);
}

// The process for updating the num property
updateState(function(oldState) {
	return Object.assign({}, oldState, {
	  num: state.num + 3
	});
});

// The process for updating a user's bio information
updateState(function(oldState) {
	return Object.assign({}, oldState, {
		name: 'Zak',
		age: 17
	});
});

console.log(state); // { num: 3, name: 'Zak', age: 17 }
```

Ok so this system is looking really good. Let's recap what exactly our state manager is now capable of doing:

1. Updating multiple pieces of state in one function call
2. Can set up an unlimited number of 'listener' functions to invoke whenever state is update
3. The state is immutable because our `updateState` callback functions are using Object.assign to return a new object that contains all of the old state's properties + the new/updated properties we want. (We'll get to why immutable data is important later)

We've almost completed our state manager! Whilst the above code is acceptable, I think our updateState function could be changed  slightly. Right now there's a couple problems with it:

1. It's not declarative
2. There's no single source of truth for how and what can be changed inside of our state

Let's explore those two points for a second. Whenever we wish to update the state of our application, we need to invoke the `updateState` function and write a bunch of logic that specifies exactly what to change on our state object. Writing logic for how to do something is an example of imperative programming: we're explicitly detailing the steps for making something happen. With declarative programming, we're only specifying _what_ we'd like to be done, not how to do it.

So you might be thinking we could just make functions that update specific things in our state. Example:

```javascript
function updateBio(name, age) {
	updateState(function(oldState) {
		return Object.assign({}, oldState, {
			name: name,
			age: age
		});
	});
}

updateBio('Zak', 17); // Cool! It's kinda declarative!
```

Now whenever we wish to update our bio, we don't need to write out the entire logic for it; because we've defined that elsewhere in our updateBio function. The problem with doing it that way is that we haven't addressed problem number two which is that we want our state manager to have a single source of truth regarding what kinds of updates we can perform on our state. You can imagine that if there's many different ways of updating state, I'm going to have many different functions declared for performing each state update: one for updating the bio, one for updating the number, one for updating just the name and so on. That's no good. Also, despite the fact that these functions exist, there's nothing in our code to stop people from  just calling `updateState` on its own without going through one of our predefined state updating functions.

So, instead of abstracting the updating of state into a named function, what if we were to refactor our `updateState` function completely such that it only takes in the type of update we want to perform, or in other words: the _action_ we'd like to perform. Now instead of performing the actual state update in the callback for `updateState`, we'll perform the state update inside of the `updateState` function itself:

```javascript
updateState({ type: 'UPDATE_BIO', name: 'Zak', age: 17 });
```

Let's update the entire state manager to use this new system.

```javascript
var state = { num: 0, name: '', age: null };
var listeners = [];

function stateModifier(oldState, action) {
	if(action.type === 'UPDATE_BIO') {
		// Basically identical to the above version's Object.assign syntax
		return Object.assign({}, oldState, {
			name: action.name,
			age: action.age
		});
	}
	if(action.type === 'INCREMENT_NUM') {
		return Object.assign({}, oldState, {
			num: action.incrementer
		});
	}

	// If we don't get a match on any of our action types, we just return the existing state
	return oldState;
}

function updateState(action) {
	state = stateModifier(state, action);
	listeners.forEach(function(listener) {
		listener();
	});
}

function subscribeToState(listener) {
	listeners.push(listener);
}

// The process for updating the num property
updateState({ type: 'UPDATE_BIO', name: 'Zak', age: 17 });

// The process for updating a user's bio information
updateState({ type: 'INCREMENT_NUM', incrementer: 5 });

console.log(state); // { num: 5, name: 'Zak', age: 17 }
```

Dang, that's a lot of code. Let's refactor this into a class we can use to make multiple state managers; this will also introduce a closure for us that prevents people from accidentally reassigning the state variable or whatever else. We'll also rename a couple of our functions to be a little more accurate in terms of their purpose:

```javascript
// function renderBio() { ... }

function createStore(reducer, initialState) {
	var state = initialState;
	var listeners = [];

	// Function used for dispatching actions that will then be processed by our stateModifier function
	function dispatchAction(action) {
		state = reducer(state, action);
		listeners.forEach(function(listener) {
			listener();
		})
	}

	// This used to be called subscribeToState, the function that adds state listening functions to our listeners array
	function subscribe(callback) {
		listeners.push(callback);
	}

	// Because of closure, we can't access state anymore unless we have a function that returns the state for us
	function getState() {
		return state;
	}

	return {
		dispatchAction: dispatchAction,
		subscribe: subscribe,
		getState: getState
	};
}

function myReducer(oldState, action) {
	if(action.type === 'UPDATE_BIO') {
		return Object.assign({}, oldState, {
			name: action.name,
			age: action.age
		});
	}
	if(action.type === 'INCREMENT_NUM') {
		return Object.assign({}, oldState, {
			num: action.incrementer
		});
	}
	return oldState;
}

// Instantiate a new store (our state manager)
// Pass in our reducer function that updates the state + whatever we want our state to be initially
var store = createStore(myReducer, {});

// Add a listener using the subscribe method
store.subscribe(function() {
	console.log("Our state just updated!");
});

// We can add as many listeners as we want, such as this hypothetical one that will rerender the bio anytime the state is updated
// store.subscribe(renderBio);

store.dispatch({ type: 'UPDATE_BIO', name: 'Zak', age: 17 });
store.dispatch({ type: 'INCREMENT_NUM', incrementer: 5 });

console.log(store.getState()); // { num: 5, name: 'Zak', age: 17 }
```

Congratulations, we just made Redux. This is the essence behind how Redux works behind the scenes and I think it demonstrates just how simple Redux actually is. You can compare the code we've just written to the actual source code for `createStore` in redux [here](https://github.com/reactjs/redux/blob/master/src/createStore.js).

In Chapter 2 of this tutorial, we'll go into actually using the real version of redux along with some of the advanced features of Redux that I didn't get into in this chapter.
