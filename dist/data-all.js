/*!
 * Data.js
 * Version 0.1.0
 *
 * Copyright(c) 2013 Gregory Jacobs.
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 *
 * https://github.com/gregjacobs/Data.js
 */

/*!
 * Class.js
 * Version 0.3.2
 * 
 * Copyright(c) 2012 Gregory Jacobs.
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 * 
 * https://github.com/gregjacobs/Class.js
 */
/**
 * @class Class
 * 
 * Utility for powerful JavaScript class creation. This provides a number of features for OOP in JavaScript, including:
 * 
 * - Single inheritance with subclasses (like Java, C#, etc.)
 * - Mixin classes
 * - Static methods, which can optionally be automatically inherited by subclasses
 * - A static method which is placed on classes that are created, which can be used to determine if the *class* is a subclass of 
 *   another (unlike the `instanceof` operator, which checks if an *instance* is a subclass of a given class).
 * - An `instanceOf()` method, which should be used instead of the JavaScript `instanceof` operator, to determine if the instance 
 *   is an instance of a provided class, superclass, or mixin (the JavaScript `instanceof` operator only covers the first two).
 * - The ability to add static methods while creating/extending a class, right inside the definition using special properties `statics`
 *   and `inheritedStatics`. The former only applies properties to the class being created, while the latter applies properties to the
 *   class being created, and all subclasses which extend it. (Note that the keyword for this had to be `statics`, and not `static`, as 
 *   `static` is a reserved word in Javascript). 
 * - A special static method, onClassExtended(), which can be placed in either the `statics` or `inheritedStatics` section, that is
 *   executed after the class has been extended.
 * 
 * Note that this is not the base class of all `Class` classes. It is a utility to create classes, and extend other classes. The
 * fact that it is not required to be at the top of any inheritance hierarchy means that you may use it to extend classes from
 * other frameworks and libraries, with all of the features that this implementation provides. 
 *  
 * Simple example of creating classes:
 *     
 *     var Animal = Class( {
 *         constructor : function( name ) {
 *             this.name = name;
 *         },
 *         
 *         sayHi : function() {
 *             alert( "Hi, my name is: " + this.name );
 *         },
 *         
 *         eat : function() {
 *             alert( this.name + " is eating" );
 *         }
 *     } );
 *     
 *     
 *     var Dog = Animal.extend( {
 *         // Override sayHi method from superclass
 *         sayHi : function() {
 *             alert( "Woof! My name is: " + this.name );
 *         }
 *     } );
 *     
 *     var Cat = Animal.extend( {
 *         // Override sayHi method from superclass
 *         sayHi : function() {
 *             alert( "Meow! My name is: " + this.name );
 *         }
 *     } );
 *     
 *     
 *     var dog1 = new Dog( "Lassie" );
 *     var dog2 = new Dog( "Bolt" );
 *     var cat = new Cat( "Leonardo Di Fishy" );
 *     
 *     dog1.sayHi();  // "Woof! My name is: Lassie"
 *     dog2.sayHi();  // "Woof! My name is: Bolt"
 *     cat.sayHi();   // "Meow! My name is: Leonardo Di Fishy"
 *     
 *     dog1.eat();  // "Lassie is eating"
 *     dog2.eat();  // "Bolt is eating"
 *     cat.eat();   // "Leonardo Di Fishy is eating"
 */
/*global window, define */
/*jslint forin:true */

// Initialization handles the availability of an AMD loader (like require.js, which has function `define()`).
// If no AMD loader, injects browser global `Class`
(function( root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		define('Class', factory );       // Handle availability of AMD loader
	} else {
		root.Class = factory();  // Browser global (root == window)
	}
}( this, function() {
	
	// Utility functions / variables	
	
	/**
	 * Determines if a value is an object.
	 * 
	 * @private
	 * @static
	 * @method isObject
	 * @param {Mixed} value
	 * @return {Boolean} True if the value is an object, false otherwise.
	 */
	function isObject( value ) {
		return !!value && Object.prototype.toString.call( value ) === '[object Object]';  
	}
	
	
	// For dealing with IE's toString() problem
	var isIE = false;
	if( typeof window !== 'undefined' ) {
		var uA = window.navigator.userAgent.toLowerCase();
		isIE = /msie/.test( uA ) && !( /opera/.test( uA ) );
	}
	
	
	// A variable, which is incremented, for assigning unique ID's to classes (constructor functions), allowing 
	// for caching through lookups on hashmaps
	var classIdCounter = 0;
	
	
	// ----------------------------------------
	
	
	/**
	 * @constructor
	 * 
	 * Creates a new class that extends from `Object` (the base class of all classes in JavaScript). Running the
	 * `Class` constructor function is equivalent of calling {@link #extend Class.extend()}. To extend classes
	 * that are already subclassed, use either {@link Class#extend}, or the static `extend` method that is added
	 * to all subclasses.
	 * 
	 * Examples for the `Class` constructor:
	 * 
	 *     // Create a new class, with Object as the superclass
	 *     // (i.e. no other particular superclass; see {@link #extend} for that)
	 *     var MyClass = new Class( {
	 *         constructor : function() {
	 *             console.log( "Constructing, 123" );
	 *         },
	 *     
	 *         method1 : function() {},
	 *         method2 : function() {}
	 *     } );
	 *     
	 *     
	 *     // Can be used without the `new` keyword as well, if desired.
	 *     // This may actually make more sense, as you're creating the definition for a class, not an instance.
	 *     var MyClass = Class( {
	 *         constructor : function() {
	 *             console.log( "Constructing, 123" );
	 *         },
	 *     
	 *         method1 : function() {},
	 *         method2 : function() {}
	 *     } );
	 *     
	 *     
	 *     // The above two examples are exactly equivalent to:
	 *     var MyClass = Class.extend( Object, {
	 *         constructor : function() {
	 *             console.log( "Constructing, 123" );
	 *         },
	 *     
	 *         method1 : function() {},
	 *         method2 : function() {}
	 *     } );
	 * 
	 * See {@link #extend} for details about extending classes.
	 * 
	 * @param {Object} classDefinition The class definition. See the `overrides` parameter of {@link #extend}.
	 */
	var Class = function( classDefinition ) {
		return Class.extend( Object, classDefinition );
	};
	
	
	/**
	 * Alias of using the Class constructor function itself. Ex:
	 * 
	 *     var Animal = Class.create( {
	 *         // class definition here
	 *     } );
	 * 
	 * @static
	 * @method create
	 * @param {Object} classDefinition The class definition. See the `overrides` parameter of {@link #extend}.
	 */
	Class.create = function( classDefinition ) {
		return Class.extend( Object, classDefinition );
	};
	
	
	/**
	 * Utility to copy all the properties of `config` to `obj`.
	 *
	 * @static
	 * @method apply
	 * @param {Object} obj The receiver of the properties
	 * @param {Object} config The source of the properties
	 * @param {Object} defaults A different object that will also be applied for default values
	 * @return {Object} returns obj
	 */
	Class.apply = function( o, c, defaults ) {
		if( defaults ) {
			Class.apply( o, defaults );  // no "this" reference for friendly out of scope calls
		}
		if( o && c && typeof c === 'object' ) {
			for( var p in c ) {
				o[ p ] = c[ p ];
			}
		}
		return o;
	};
	
	
	/**
	 * Utility to copy all the properties of `config` to `obj`, if they don't already exist on `obj`.
	 *
	 * @static
	 * @method applyIf
	 * @param {Object} obj The receiver of the properties
	 * @param {Object} config The source of the properties
	 * @return {Object} returns obj
	 */
	Class.applyIf = function( o, c ) {
		if( o ) {
			for( var p in c ) {
				if( typeof o[ p ] === 'undefined' ) {
					o[ p ] = c[ p ];
				}
			}
		}
		return o;
	};
	
	
	/**
	 * A function which can be referenced from class definition code to specify an abstract method.
	 * This method (function) simply throws an error if called, meaning that the method must be overridden in a
	 * subclass. Ex:
	 * 
	 *     var AbstractClass = Class( {
	 *         myMethod : Class.abstractMethod
	 *     } );
	 */
	Class.abstractMethod = function() {
		throw new Error( "method must be implemented in subclass" );
	};
	
		
	/**
	 * Extends one class to create a subclass of it based on a passed object literal (`overrides`), and optionally any mixin 
	 * classes that are desired.
	 * 
	 * This method adds a few methods to the class that it creates:
	 * 
	 * - override : Method that can be used to override members of the class with a passed object literal. 
	 *   Same as {@link #override}, without the first argument.
	 * - extend : Method that can be used to directly extend the class. Same as this method, except without
	 *   the first argument.
	 * - hasMixin : Method that can be used to find out if the class (or any of its superclasses) implement a given mixin. 
	 *   Accepts one argument: the class (constructor function) of the mixin. Note that it is preferable to check if a given 
	 *   object is an instance of another class or has a mixin by using the {@link #isInstanceOf} method. This hasMixin() 
	 *   method will just determine if the class has a given mixin, and not if it is an instance of a superclass, or even an 
	 *   instance of itself.
	 * 
	 * 
	 * For example, to create a subclass of MySuperclass:
	 * 
	 *     MyComponent = Class.extend( MySuperclass, {
	 *         
	 *         constructor : function( config ) {
	 *             // apply the properties of the config object to this instance
	 *             Class.apply( this, config );
	 *             
	 *             // Call superclass constructor
	 *             MyComponent.superclass.constructor.call( this );
	 *             
	 *             // Your postprocessing here
	 *         },
	 *     
	 *         // extension of another method (assuming MySuperclass had this method)
	 *         someMethod : function() {
	 *             // some preprocessing, if needed
	 *         
	 *             MyComponent.superclass.someMethod.apply( this, arguments );  // send all arguments to superclass method
	 *             
	 *             // some post processing, if needed
	 *         },
	 *     
	 *         // a new method for this subclass (not an extended method)
	 *         yourMethod: function() {
	 *             // implementation
	 *         }
	 *     } );
	 *
	 * This is an example of creating a class with a mixin called MyMixin:
	 * 
	 *     MyComponent = Class.extend( Class.util.Observable, {
	 *         mixins : [ MyMixin ],
	 *         
	 *         constructor : function( config ) {
	 *             // apply the properties of the config to the object
	 *             Class.apply( this, config );
	 *             
	 *             // Call superclass constructor
	 *             MyComponent.superclass.constructor.call( this );
	 *             
	 *             // Call the mixin's constructor
	 *             MyMixin.constructor.call( this );
	 *             
	 *             // Your postprocessing here
	 *         },
	 *         
	 *         
	 *         // properties/methods of the mixin will be added automatically, if they don't exist already on the class
	 *         
	 *         
	 *         // method that overrides or extends a mixin's method
	 *         mixinMethod : function() {
	 *             // call the mixin's method, if desired
	 *             MyMixin.prototype.mixinMethod.call( this );
	 *             
	 *             // post processing
	 *         }
	 *         
	 *     } );
	 * 
	 * Note that calling superclass methods can be done with either the [Class].superclass or [Class].__super__ property.
	 *
	 * @static
	 * @method extend
	 * @param {Function} superclass The constructor function of the class being extended. If making a brand new class with no superclass, this may
	 *   either be omitted, or provided as `Object`.
	 * @param {Object} overrides An object literal with members that make up the subclass's properties/method. These are copied into the subclass's
	 *   prototype, and are therefore shared between all instances of the new class. This may contain a special member named
	 *   `constructor`, which is used to define the constructor function of the new subclass. If this property is *not* specified,
	 *   a constructor function is generated and returned which just calls the superclass's constructor, passing on its parameters.
	 *   **It is essential that you call the superclass constructor in any provided constructor.** See example code.
	 * @return {Function} The subclass constructor from the `overrides` parameter, or a generated one if not provided.
	 */
	Class.extend = (function() {
		// Set up some private vars that will be used with the extend() method
		var superclassMethodCallRegex = /xyz/.test( function(){ var a = "xyz"; } ) ? /\b_super\b/ : /.*/;  // a regex to see if the _super() method is called within a function, for JS implementations that allow a function's text to be converted to a string. Note, need to keep the "xyz" as a string, so minifiers don't re-write it. 
		
		// inline override() function which is attached to subclass constructor functions
		var inlineOverride = function( obj ) {
			for( var p in obj ) {
				this[ p ] = obj[ p ];
			}
		};
		
	
		// extend() method itself
		return function( superclass, overrides ) {	
			// The first argument may be omitted, making Object the superclass
			if( arguments.length === 1 ) {
				overrides = superclass;
				superclass = Object;
			}
			
			
			var subclass,           // the actual subclass's constructor function which will be created. This ends up being a wrapper for the subclassCtorImplFn, which the user defines
			    subclassCtorImplFn, // the actual implementation of the subclass's constructor, which the user defines
			    F = function(){}, 
			    subclassPrototype,
			    superclassPrototype = superclass.prototype,
			    abstractClass = !!overrides.abstractClass,
			    prop;
			
			
			// Grab any special properties from the overrides, and then delete them so that they aren't
			// applied to the subclass's prototype when we copy all of the 'overrides' properties there
			var statics = overrides.statics,
			    inheritedStatics = overrides.inheritedStatics,
			    mixins = overrides.mixins;
			
			delete overrides.statics;
			delete overrides.inheritedStatics;
			delete overrides.mixins;
			
			// --------------------------
			
			// Before creating the new subclass pre-process the methods of the subclass (defined in "overrides") to add the this._super()
			// method for methods that can call their associated superclass method. This should happen before defining the new subclass,
			// so that the constructor function can be wrapped as well.
			
			// A function which wraps methods of the new subclass that can call their superclass method
			var createSuperclassCallingMethod = function( fnName, fn ) {
				return function() {
					var tmpSuper = this._super,  // store any current _super reference, so we can "pop it off the stack" when the method returns
					    scope = this;
					
					// Add the new _super() method that points to the superclass's method
					this._super = function( args ) {  // args is an array (or arguments object) of arguments
						return superclassPrototype[ fnName ].apply( scope, args || [] );
					};
					
					// Now call the target method
					var returnVal = fn.apply( this, arguments );
					
					// And finally, restore the old _super reference, as we leave the stack context
					this._super = tmpSuper;
					
					return returnVal;
				};
			};
			
			
			// Wrap all methods that use this._super() in the function that will allow this behavior (defined above), except
			// for the special 'constructor' property, which needs to be handled differently for IE (done below).
			for( prop in overrides ) {
				if( 
				    prop !== 'constructor' &&                               // We process the constructor separately, below (which is needed for IE, because IE8 and probably all versions below it won't enumerate it in a for-in loop, for whatever reason...)
				    overrides.hasOwnProperty( prop ) &&                     // Make sure the property is on the overrides object itself (not a prototype object)
				    typeof overrides[ prop ] === 'function' &&              // Make sure the override property is a function (method)
				    typeof superclassPrototype[ prop ] === 'function' &&    // Make sure the superclass has the same named function (method)
				    !overrides[ prop ].hasOwnProperty( '__Class' ) &&       // We don't want to wrap a constructor function of another class being provided as a prototype property to the class being created
				    superclassMethodCallRegex.test( overrides[ prop ] )     // And check to see if the string "_super" exists within the override function
				) {
					overrides[ prop ] = createSuperclassCallingMethod( prop, overrides[ prop ] );
				}
			}
			
			// Process the constructor on its own, here, because IE8 (and probably all versions below it) will not enumerate it 
			// in the for-in loop above (for whatever reason...)
			if( 
			    overrides.hasOwnProperty( 'constructor' ) &&  // make sure we don't get the constructor property from Object
			    typeof overrides.constructor === 'function' && 
			    typeof superclassPrototype.constructor === 'function' && 
			    superclassMethodCallRegex.test( overrides.constructor )
			) {
				overrides.constructor = createSuperclassCallingMethod( 'constructor', overrides.constructor );
			}
			
			// --------------------------
			
			
			// Now that preprocessing is complete, define the new subclass's constructor *implementation* function. 
			// This is going to be wrapped in the actual subclass's constructor
			if( overrides.constructor !== Object ) {
				subclassCtorImplFn = overrides.constructor;
				delete overrides.constructor;  // Remove 'constructor' property from overrides here, so we don't accidentally re-apply it to the subclass prototype when we copy all properties over
			} else {
				subclassCtorImplFn = ( superclass === Object ) ? function(){} : function() { return superclass.apply( this, arguments ); };   // create a "default constructor" that automatically calls the superclass's constructor, unless the superclass is Object (in which case we don't need to, as we already have a new object)
			}
			
			// Create the actual subclass's constructor, which tests to see if the class being instantiated is abstract,
			// and if not, calls the subclassCtorFn implementation function
			subclass = function() {
				var proto = this.constructor.prototype;
				if( proto.hasOwnProperty( 'abstractClass' ) && proto.abstractClass === true ) {
					throw new Error( "Error: Cannot instantiate abstract class" );
				}
				
				// Call the actual constructor's implementation
				return subclassCtorImplFn.apply( this, arguments );
			};
			
			
			F.prototype = superclassPrototype;
			subclassPrototype = subclass.prototype = new F();  // set up prototype chain
			subclassPrototype.constructor = subclass;          // fix constructor property
			subclass.superclass = subclass.__super__ = superclassPrototype;
			subclass.__Class = true;  // a flag for testing if a given function is a class or not
			
			// Attach new static methods to the subclass
			subclass.override = function( overrides ) { Class.override( subclass, overrides ); };
			subclass.extend = function( overrides ) { return Class.extend( subclass, overrides ); };
			subclass.hasMixin = function( mixin ) { return Class.hasMixin( subclass, mixin ); };
			
			// Attach new instance methods to the subclass
			subclassPrototype.superclass = subclassPrototype.supr = function() { return superclassPrototype; };
			subclassPrototype.override = inlineOverride;   // inlineOverride function defined above
			subclassPrototype.hasMixin = function( mixin ) { return Class.hasMixin( this.constructor, mixin ); };
			
			// Finally, add the properties/methods defined in the "overrides" config (which is basically the subclass's 
			// properties/methods) onto the subclass prototype now.
			Class.override( subclass, overrides );
			
			
			// -----------------------------------
			
			// Check that if it is a concrete (i.e. non-abstract) class, that all abstract methods have been implemented
			// (i.e. that the concrete class overrides any `Class.abstractMethod` functions from its superclass)
			if( !abstractClass ) {
				for( var methodName in subclassPrototype ) {
					if( subclassPrototype[ methodName ] === Class.abstractMethod ) {  // NOTE: Do *not* filter out prototype properties; we want to test them
						if( subclassPrototype.hasOwnProperty( methodName ) ) {
							throw new Error( "The class being created has abstract method '" + methodName + "', but is not declared with 'abstractClass: true'" );
						} else {
							throw new Error( "The concrete subclass being created must implement abstract method: '" + methodName + "', or be declared abstract as well (using 'abstractClass: true')" );
						}
					}
				}
			}
			
			// -----------------------------------
			
			// Now apply inherited statics to the class. Inherited statics from the superclass are first applied,
			// and then all overrides (so that subclasses's inheritableStatics take precedence)
			if( inheritedStatics || superclass.__Class_inheritedStatics ) {
				inheritedStatics = Class.apply( {}, inheritedStatics, superclass.__Class_inheritedStatics );  // inheritedStatics takes precedence of the superclass's inherited statics
				Class.apply( subclass, inheritedStatics );
				subclass.__Class_inheritedStatics = inheritedStatics;  // store the inheritedStatics for the next subclass
			}
			
			// Now apply statics to the class. These statics should override any inheritableStatics for the current subclass.
			// However, the inheritableStatics will still affect subclasses of this subclass.
			if( statics ) {
				Class.apply( subclass, statics );
			}
			
			
			// Handle mixins by applying their methods/properties to the subclass prototype. Methods defined by
			// the class itself will not be overwritten, and the later defined mixins take precedence over earlier
			// defined mixins. (Moving backwards through the mixins array to have the later mixin's methods/properties take priority)
			if( mixins ) {
				for( var i = mixins.length-1; i >= 0; i-- ) {
					var mixinPrototype = mixins[ i ].prototype;
					for( prop in mixinPrototype ) {
						// Do not overwrite properties that already exist on the prototype
						if( typeof subclassPrototype[ prop ] === 'undefined' ) {
							subclassPrototype[ prop ] = mixinPrototype[ prop ];
						}
					}
				}
			
				// Store which mixin classes the subclass has. This is used in the hasMixin() method
				subclass.mixins = mixins;
			}
			
			
			// If there is a static onClassExtended method, call it now with the new subclass as the argument
			if( typeof subclass.onClassExtended === 'function' ) {
				subclass.onClassExtended( subclass );
			}
			
			return subclass;
		};
	} )();
	

	/**
	 * Adds a list of functions to the prototype of an existing class, overwriting any existing methods with the same name.
	 * Usage:
	 * 
	 *     Class.override( MyClass, {
	 *         newMethod1 : function() {
	 *             // etc.
	 *         },
	 *         newMethod2 : function( foo ) {
	 *             // etc.
	 *         }
	 *     } );
	 * 
	 * @static
	 * @method override
	 * @param {Object} origclass The class to override
	 * @param {Object} overrides The list of functions to add to origClass.  This should be specified as an object literal
	 * containing one or more methods.
	 */
	Class.override = function( origclass, overrides ) {
		if( overrides ){
			var p = origclass.prototype;
			Class.apply( p, overrides );
			if( isIE && overrides.hasOwnProperty( 'toString' ) ) {
				p.toString = overrides.toString;
			}
		}
	};
	


	/**
	 * Determines if a given object (`obj`) is an instance of a given class (`jsClass`). This method will
	 * return true if the `obj` is an instance of the `jsClass` itself, if it is a subclass of the `jsClass`,
	 * or if the `jsClass` is a mixin on the `obj`. For more information about classes and mixins, see the
	 * {@link #extend} method.
	 * 
	 * @static
	 * @method isInstanceOf
	 * @param {Mixed} obj The object (instance) to test.
	 * @param {Function} jsClass The class (constructor function) of which to see if the `obj` is an instance of, or has a mixin of.
	 * @return {Boolean} True if the obj is an instance of the jsClass (it is a direct instance of it, 
	 *   it inherits from it, or the jsClass is a mixin of it)
	 */
	Class.isInstanceOf = function( obj, jsClass ) {
		if( typeof jsClass !== 'function' ) {
			throw new Error( "jsClass argument of isInstanceOf method expected a Function (constructor function) for a JavaScript class" );
		}
		
		if( !isObject( obj ) ) {
			return false;
		} else if( obj instanceof jsClass ) {
			return true;
		} else if( Class.hasMixin( obj.constructor, jsClass ) ) {
			return true;
		} else {
			return false;
		}
	};
	
	
	/**
	 * Determines if a class (i.e. constructor function) is, or is a subclass of, the given `baseClass`.
	 * 
	 * The order of the arguments follows how {@link #isInstanceOf} accepts them (as well as the JavaScript
	 * `instanceof` operator. Try reading it as if there was a `subclassof` operator, i.e. `subcls subclassof supercls`.
	 * 
	 * Example:
	 *     var Superclass = Class( {} );
	 *     var Subclass = Superclass.extend( {} );
	 *     
	 *     Class.isSubclassOf( Subclass, Superclass );   // true - Subclass is derived from (i.e. extends) Superclass
	 *     Class.isSubclassOf( Superclass, Superclass ); // true - Superclass is the same class as itself
	 *     Class.isSubclassOf( Subclass, Subclass );     // true - Subclass is the same class as itself
	 *     Class.isSubclassOf( Superclass, Subclass );   // false - Superclass is *not* derived from Subclass
	 * 
	 * @static
	 * @method isSubclassOf
	 * @param {Function} subclass The class to test.
	 * @param {Function} superclass The class to test against.
	 * @return {Boolean} True if the `subclass` is derived from `superclass` (or is equal to `superclass`), false otherwise.
	 */
	Class.isSubclassOf = function( subclass, superclass ) {
		if( typeof subclass !== 'function' || typeof superclass !== 'function' ) {
			return false;
			
		} else if( subclass === superclass ) {
			// `subclass` is `superclass`, return true 
			return true;
			
		} else {
			// Walk the prototype chain of `subclass`, looking for `superclass`
			var currentClass = subclass,
			    currentClassProto = currentClass.prototype;
			
			while( ( currentClass = ( currentClassProto = currentClass.__super__ ) && currentClassProto.constructor ) ) {  // extra set of parens to get JSLint to stop complaining about an assignment inside a while expression
				if( currentClassProto.constructor === superclass ) {
					return true;
				}
			}
		}
		
		return false;
	};
	
	
	
	/**
	 * Determines if a class has a given mixin. Note: Most likely, you will want to use {@link #isInstanceOf} instead,
	 * as that will tell you if the given class either extends another class, or either has, or extends a class with
	 * a given mixin.
	 * 
	 * @static
	 * @method hasMixin
	 * @param {Function} classToTest
	 * @param {Function} mixinClass
	 */
	Class.hasMixin = function( classToTest, mixinClass ) {
		// Assign the mixinClass (the class we're looking for as a mixin) an ID if it doesn't yet have one. This is done
		// here (instead of in extend()) so that any class can be used as a mixin, not just ones extended from Class.js)
		var mixinClassId = mixinClass.__Class_classId;
		if( !mixinClassId ) {
			mixinClassId = mixinClass.__Class_classId = ++classIdCounter;  // classIdCounter is from outer anonymous function of this class, and is used to assign a unique ID
		}
		
		// Create a cache for quick re-lookups of the mixin on this class
		var hasMixinCache = classToTest.__Class_hasMixinCache;
		if( !hasMixinCache ) {
			hasMixinCache = classToTest.__Class_hasMixinCache = {};
		}
		
		// If we have the results of a call to this method for this mixin already, returned the cached result
		if( mixinClassId in hasMixinCache ) {
			return hasMixinCache[ mixinClassId ];
		
		} else {
			// No cached result from a previous call to this method for the mixin, do the lookup
			var mixins = classToTest.mixins,
			    superclass = ( classToTest.superclass || classToTest.__super__ );
			
			// Look for the mixin on the classToTest, if it has any
			if( mixins ) {
				for( var i = 0, len = mixins.length; i < len; i++ ) {
					if( mixins[ i ] === mixinClass ) {
						return ( hasMixinCache[ mixinClassId ] = true );  // mixin was found, cache the result and return
					}
				}
			}
			
			// mixin wasn't found on the classToTest, check its superclass for the mixin (if it has one)
			if( superclass && superclass.constructor && superclass.constructor !== Object ) {
				var returnValue = Class.hasMixin( superclass.constructor, mixinClass );
				return ( hasMixinCache[ mixinClassId ] = returnValue );  // cache the result from the call to its superclass, and return that value
				
			} else {
				// mixin wasn't found, and the class has no superclass, cache the result and return false
				return ( hasMixinCache[ mixinClassId ] = false );
			}
		}
	};
	
	
	return Class;
	
} ) );


/*global define */
define('data/Data',[], function() {
	
	/**
	 * @class data.Data
	 * @singleton
	 * 
	 * Main singleton class and a few utility functions for the Data.js library. 
	 */
	var Data = {
		
		/**
		 * An empty function which can be used in place of creating a new function object. 
		 * 
		 * This is useful for contexts where say, a callback function is called, but the user
		 * has not provided their own implementation (i.e. an optional callback). Also useful
		 * for creating hook methods in classes. Basically the same thing as `jQuery.noop()`.
		 *
		 * @method emptyFn
		 */
		emptyFn : function() {}
		
	};
	
	return Data;
	
} );

/*global define */
/*jslint forin: true */
(function( root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		define('Observable', [ 'lodash', 'Class' ], factory );  // AMD (such as RequireJS). Register as module.
	} else {
		root.Observable = factory( root._, root.Class );  // Browser global. root == window
	}
}( this, function( _, Class ) {
	
	var TOARRAY = _.toArray,
		ISOBJECT = _.isObject,
		TRUE = true,
		FALSE = false;
	
	
	// Utility class for buffered and delayed listeners
	var DelayedTask = function(fn, scope, args){
		var me = this,
		    id,
		    call = function(){
		        clearInterval(id);
		        id = null;
		        fn.apply(scope, args || []);
			};
			
		me.delay = function(delay, newFn, newScope, newArgs){
			me.cancel();
			fn = newFn || fn;
			scope = newScope || scope;
			args = newArgs || args;
			id = setInterval(call, delay);
		};
		
		me.cancel = function(){
			if(id){
				clearInterval(id);
				id = null;
			}
		};
		
		me.isPending = function() {
			return !!id;
		};
	};
	
	
	
	var Event = function(obj, name){
		this.name = name;
		this.obj = obj;
		this.listeners = [];
	};
	
	Event.prototype = {
		addListener : function(fn, scope, options){
			var me = this,
			    l;
			scope = scope || me.obj;
			if(!me.isListening(fn, scope)){
				l = me.createListener(fn, scope, options);
				if(me.firing){ // if we are currently firing this event, don't disturb the listener loop
					me.listeners = me.listeners.slice(0);
				}
				me.listeners.push(l);
			}
		},
	
		createListener: function(fn, scope, o){
			o = o || {};
			scope = scope || this.obj;
			
			var l = {
				fn: fn,
				scope: scope,
				options: o
			}, h = fn;
			if(o.delay){
				h = createDelayed(h, o, l, scope);
			}
			if(o.single){
				h = createSingle(h, this, fn, scope);
			}
			if(o.buffer){
				h = createBuffered(h, o, l, scope);
			}
			l.fireFn = h;
			return l;
		},
	
		findListener : function(fn, scope){
			var list = this.listeners,
			    i = list.length,
			    l,
			    s;
			while(i--) {
				l = list[i];
				if(l) {
					s = l.scope;
					if(l.fn === fn && (s === scope || s === this.obj)){
						return i;
					}
				}
			}
			return -1;
		},
	
		isListening : function(fn, scope){
			return this.findListener(fn, scope) !== -1;
		},
	
		removeListener : function(fn, scope){
			var index,
			    l,
			    k,
			    me = this,
			    ret = FALSE;
			if((index = me.findListener(fn, scope)) !== -1){
				if (me.firing) {
					me.listeners = me.listeners.slice(0);
				}
				l = me.listeners[index];
				if(l.task) {
					l.task.cancel();
					delete l.task;
				}
				k = l.tasks && l.tasks.length;
				if(k) {
					while(k--) {
						l.tasks[k].cancel();
					}
					delete l.tasks;
				}
				me.listeners.splice(index, 1);
				ret = TRUE;
			}
			return ret;
		},
	
		// Iterate to stop any buffered/delayed events
		clearListeners : function(){
			var me = this,
			    l = me.listeners,
			    i = l.length;
			while(i--) {
				me.removeListener(l[i].fn, l[i].scope);
			}
		},
	
		fire : function() {
			var me = this,
			    args = TOARRAY(arguments),
			    listeners = me.listeners,
			    len = listeners.length,
			    i = 0,
			    l,
			    handlerReturnedFalse = false;  // added code
	
			if(len > 0){
				me.firing = TRUE;
				for (; i < len; i++) {
					l = listeners[i];
					if(l && l.fireFn.apply(l.scope || me.obj || window, args) === FALSE) {
						handlerReturnedFalse = true;
						//return (me.firing = FALSE);  -- old code, prevented other handlers from running if one returned false
					}
				}
			}
			me.firing = FALSE;
			//return TRUE;  -- old code
			return ( handlerReturnedFalse ) ? false : true;  // if any of the event handlers returned false, return false from this method. otherwise, return true
		}
	};
	
	
		
	/**
	 * @class Observable
	 * 
	 * Base class that provides a common interface for publishing events. Subclasses are expected to
	 * to have a property "events" with all the events defined, and, optionally, a property "listeners"
	 * with configured listeners defined.
	 * 
	 * For example:
	 * 
	 *     Employee = Class.extend(Observable, {
	 *         constructor: function( config ) {
	 *             this.name = config.name;
	 *             this.addEvents( {
	 *                 "fired" : true,
	 *                 "quit" : true
	 *             } );
	 *     
	 *             // Copy configured listeners into *this* object so that the base class&#39;s
	 *             // constructor will add them.
	 *             this.listeners = config.listeners;
	 *     
	 *             // Call our superclass constructor to complete construction process.
	 *             Employee.superclass.constructor.call( config )
	 *         }
	 *     });
	 * 
	 * 
	 * This could then be used like this:
	 * 
	 *     var newEmployee = new Employee({
	 *         name: employeeName,
	 *         listeners: {
	 *             'quit': function() {
	 *                 // By default, "this" will be the object that fired the event.
	 *                 alert( this.name + " has quit!" );
	 *             }
	 *         }
	 *     });
	 * 
	 * 
	 * Note that it is possible to subscribe to *all* events from a given Observable, by subscribing to the
	 * special {@link #event-all all} event.
	 */
	var Observable = Class.extend( Object, {
		
		/**
		 * @cfg {Object} listeners (optional) 
		 * A config object containing one or more event handlers to be added to this object during initialization.  
		 * This should be a valid listeners config object as specified in the {@link #addListener} example for attaching 
		 * multiple handlers at once.
		 */
	
		/**
		 * @private
		 * @property {RegExp} filterOptRe
		 */
		filterOptRe : /^(?:scope|delay|buffer|single)$/,
		
		
		/**
		 * @constructor
		 * Instantiates a new Observable object.
		 */
		constructor : function() {
			var me = this, e = me.events;
			me.events = e || {};
			if( me.listeners ) {
				me.on( me.listeners );
				delete me.listeners;
			}
			
			this.addEvents(
				/**
				 * Special event which can be used to subscribe to *all* events from the Observable. When a given event
				 * is fired, this event is fired immediately after it, with the name of the original event as the first
				 * argument, and all other original arguments provided immediately after.
				 * 
				 * Ex:
				 * 
				 *     var myObservable = new Observable();
				 *     myObservable.on( 'all', function( eventName ) {
				 *         console.log( "Event '" + eventName + "' was fired with args: ", Array.prototype.slice.call( arguments, 1 ) );
				 *     } );
				 *     
				 *     myObservable.fireEvent( 'change', 'a', 'b', 'c' );
				 *     // console: Event 'change' was fired with args: [ "a", "b", "c" ]
				 *     
				 * 
				 * @event all
				 * @param {String} eventName The name of the original event that was fired.
				 * @param {Mixed...} args The original arguments that were provided with the original event.  
				 */
				'all'
			);
		},
	
	
	
		/**
		 * Fires the specified event with the passed parameters (minus the event name).
		 * 
		 * @method fireEvent
		 * @param {String} eventName The name of the event to fire.
		 * @param {Object...} args Variable number of parameters are passed to handlers.
		 * @return {Boolean} returns false if any of the handlers return false otherwise it returns true.
		 */
		fireEvent : function() {
			var args = TOARRAY(arguments),
			    eventName = args[0].toLowerCase(),
			    me = this,
			    ret = TRUE,
			    ce = me.events[eventName],
			    q,
			    parentComponent;
				
			if (me.eventsSuspended === TRUE) {
				q = me.eventQueue;
				if (q) {
					q.push(args);
				}
				
			} else if( ISOBJECT( ce ) ) {
				args.shift();
				ret = ce.fire.apply( ce, args );
			}
			
			// Fire an "all" event, which is a special event that can be used to capture all events on an Observable. The first
			// argument passed to handlers will be the event name, and all arguments that were passed from the original event will follow.
			if( eventName !== 'all' ) {
				this.fireEvent.apply( this, [ 'all' ].concat( Array.prototype.slice.call( arguments, 0 ) ) );
			}
			
			return ret;
		},
		
		
	
		/**
		 * Appends an event handler to this object.
		 * 
		 * @method addListener
		 * @param {String} eventName The name of the event to listen for.
		 * @param {Function} handler The method the event invokes.
		 * @param {Object} [scope] The scope (`this` reference) in which the handler function is executed. **If omitted, defaults to the object which fired the event.**
		 * 
		 * Alternatively, a single options object may be provided:
		 * @param {Object} [options] An object containing handler configuration properties. This may contain any of the following properties:
		 * @param {Object} [options.scope] The scope (`this` reference) in which the handler function is executed. **If omitted, defaults to the object which fired the event.**
		 * @param {Number} [options.delay] The number of milliseconds to delay the invocation of the handler after the event fires.
		 * @param {Boolean} [options.single] True to add a handler to handle just the next firing of the event, and then remove itself.
		 * @param {Number} [options.buffer] Causes the handler to be scheduled to run in a delayed fashion by the specified number of milliseconds. 
		 *   If the event fires again within that time, the original handler is *not* invoked, but the new handler is scheduled in its place.
		 * 
		 * 
		 * **Combining Options**
		 * Using the options argument, it is possible to combine different types of listeners:
		 * 
		 * A delayed, one-time listener.
		 *     myDataView.on('click', this.onClick, this, {
		 *         single: true,
		 *         delay: 100
		 *     });
		 * 
		 * **Attaching multiple handlers in 1 call**
		 * The method also allows for a single argument to be passed which is a config object containing properties
		 * which specify multiple handlers.
		 * 
		 *     myGridPanel.on({
		 *         'click' : {
		 *             fn: this.onClick,
		 *             scope: this,
		 *             delay: 100
		 *         },
		 *         'mouseover' : {
		 *             fn: this.onMouseOver,
		 *             scope: this
		 *         },
		 *         'mouseout' : {
		 *             fn: this.onMouseOut,
		 *             scope: this
		 *         }
		 *     });
		 * 
		 * Or a shorthand syntax:
		 *     myGridPanel.on( {
		 *         'click' : this.onClick,
		 *         'mouseover' : this.onMouseOver,
		 *         'mouseout' : this.onMouseOut,
		 *         scope: this
		 *     } );
		 */
		addListener : function( eventName, fn, scope, o ) {
			var me = this,
			    e,
			    oe,
			    isF,
			    ce;
				
			if (ISOBJECT(eventName)) {
				o = eventName;
				for (e in o){
					oe = o[e];
					if (!me.filterOptRe.test(e)) {
						me.addListener(e, oe.fn || oe, oe.scope || o.scope, oe.fn ? oe : o);
					}
				}
			} else {
				eventName = eventName.toLowerCase();
				ce = me.events[eventName] || TRUE;
				if (_.isBoolean(ce)) {
					me.events[eventName] = ce = new Event(me, eventName);
				}
				ce.addListener(fn, scope, ISOBJECT(o) ? o : {});
			}
			
			return this;
		},
	
		/**
		 * Removes an event handler.
		 * @param {String}   eventName The type of event the handler was associated with.
		 * @param {Function} handler   The handler to remove. <b>This must be a reference to the function passed into the {@link #addListener} call.</b>
		 * @param {Object}   scope	 (optional) The scope originally specified for the handler.
		 */
		removeListener : function( eventName, fn, scope ) {
			if( typeof eventName === 'object' ) {
				var events = eventName; // for clarity
				for( var event in events ) {
					this.removeListener( event, events[ event ], events.scope );
				}
			} else {
				var ce = this.events[ eventName.toLowerCase() ];
				if ( ISOBJECT( ce ) ) {
					ce.removeListener( fn, scope );
				}
			}
			
			return this;
		},
		
	
		/**
		 * Removes all listeners for this object
		 */
		purgeListeners : function() {
			var events = this.events,
				evt,
				key;
			
			for( key in events ) {
				evt = events[ key ];
				if( ISOBJECT( evt ) ) {
					evt.clearListeners();
				}
			}
		},
		
	
		/**
		 * Adds the specified events to the list of events which this Observable may fire.
		 * Usage:
		 * 
		 *     this.addEvents( 'storeloaded', 'storecleared' );
		 * 
		 * 
		 * @method addEvents
		 * @param {Object/String} o Either an object with event names as properties with a value of <code>true</code>
		 * or the first event name string if multiple event names are being passed as separate parameters.
		 * @param {String} Optional. Event name if multiple event names are being passed as separate parameters.
		 */
		addEvents : function( o ) {
			var me = this;
			me.events = me.events || {};
			if (_.isString(o)) {
				var a = arguments,
				    i = a.length;
				while(i--) {
					me.events[a[i]] = me.events[a[i]] || TRUE;
				}
			} else {
				_.defaults(me.events, o);
			}
		},
	
	
		/**
		 * Checks to see if this object has any listeners for a specified event
		 * 
		 * @method hasListener
		 * @param {String} eventName The name of the event to check for
		 * @return {Boolean} True if the event is being listened for, else false
		 */
		hasListener : function( eventName ){
			var e = this.events[eventName];
			return ISOBJECT(e) && e.listeners.length > 0;
		},
	
	
		/**
		 * Suspend the firing of all events. (see {@link #resumeEvents})
		 * 
		 * @method suspendEvents
		 * @param {Boolean} queueSuspended Pass as true to queue up suspended events to be fired
		 *   after the {@link #resumeEvents} call instead of discarding all suspended events;
		 */
		suspendEvents : function(queueSuspended){
			this.eventsSuspended = TRUE;
			if(queueSuspended && !this.eventQueue){
				this.eventQueue = [];
			}
		},
	
	
		/**
		 * Resume firing events. (see {@link #suspendEvents})
		 * If events were suspended using the `<b>queueSuspended</b>` parameter, then all
		 * events fired during event suspension will be sent to any listeners now.
		 * 
		 * @method resumeEvents
		 */
		resumeEvents : function() {
			var me = this,
			    queued = me.eventQueue || [];
			me.eventsSuspended = FALSE;
			delete me.eventQueue;
			
			for( var i = 0, len = queued.length; i < len; i++ ) {
				var result = me.fireEvent.apply( me, queued[ i ] );
				if( result === false ) {  // handler returned false, stop firing other events. Not sure why we'd need this, but this was the original behavior with the .each() method
					return;
				}
			}
		}
		
	} );
	
	
	
	var ObservableProto = Observable.prototype;
	
	/**
	 * Appends an event handler to this object (shorthand for {@link #addListener}.)
	 * 
	 * @method on
	 * @param {String} eventName The type of event to listen for
	 * @param {Function} handler The method the event invokes
	 * @param {Object} scope (optional) The scope (`this` reference) in which the handler function is executed.
	 *   **If omitted, defaults to the object which fired the event.**
	 * @param {Object} options (optional) An object containing handler configuration.
	 */
	ObservableProto.on = ObservableProto.addListener;
	
	/**
	 * Removes an event handler (shorthand for {@link #removeListener}.)
	 * 
	 * @method un
	 * @param {String} eventName The type of event the handler was associated with.
	 * @param {Function} handler The handler to remove. **This must be a reference to the function passed into the {@link #addListener} call.**
	 * @param {Object} scope (optional) The scope originally specified for the handler.
	 */
	ObservableProto.un = ObservableProto.removeListener;
	
	
	function createBuffered(h, o, l, scope){
		l.task = new DelayedTask();
		return function(){
			l.task.delay(o.buffer, h, scope, TOARRAY(arguments));
		};
	}
	
	function createSingle(h, e, fn, scope){
		return function(){
			e.removeListener(fn, scope);
			return h.apply(scope, arguments);
		};
	}
	
	function createDelayed(h, o, l, scope){
		return function(){
			var task = new DelayedTask();
			if(!l.tasks) {
				l.tasks = [];
			}
			l.tasks.push(task);
			task.delay(o.delay || 10, h, scope, TOARRAY(arguments));
		};
	}
	
	
	return Observable;
	
} ) );
/*global define */
define('data/DataComponent', [
	'lodash',
	'Class',
	'Observable'
], function( _, Class, Observable ) {

	/**
	 * @private
	 * @abstract
	 * @class data.DataComponent
	 * @extends Observable
	 * 
	 * Base class for data-holding classes ({@link data.Model} and {@link data.Collection}), that abstracts out some
	 * of the commonalities between them.
	 * 
	 * This class is used internally by the framework, and shouldn't be used directly.
	 */
	var DataComponent = Class.extend( Observable, {
		abstractClass : true,
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the DataComponent's data to/from persistent
		 * storage. If this is not specified, the DataComponent may not save or load its data to/from an external
		 * source. (Note that the way that the DataComponent loads/saves its data is dependent on the particular
		 * implementation.)
		 */
		proxy : null,
		
		
		/**
		 * @protected
		 * @property {String} clientId (readonly)
		 * 
		 * A unique ID for the Model on the client side. This is used to uniquely identify each Model instance.
		 * Retrieve with {@link #getClientId}.
		 */
		
		
		constructor : function() {
			// Call the superclass's constructor (Observable)
			this._super( arguments );
			
			// Create a client ID for the DataComponent
			this.clientId = 'c' + _.uniqueId();
		},
		
		
		/**
		 * Retrieves the DataComponent's unique {@link #clientId}.
		 * 
		 * @return {String} The DataComponent's unique {@link #clientId}. 
		 */
		getClientId : function() {
			return this.clientId;
		},
		
		
		/**
		 * Retrieves the native JavaScript value for the DataComponent.
		 * 
		 * @abstract
		 * @method getData
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link data.attribute.Attribute Attribute} values.
		 */
		getData : Class.abstractMethod,
		
		
		/**
		 * Determines if the DataComponent has any modifications.
		 * 
		 * @abstract
		 * @method isModified
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method.  Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link data.attribute.Attribute#persist persisted} 
		 *   attribute of a Model is modified within the DataComponent.
		 * @return {Boolean}
		 */
		isModified : Class.abstractMethod,
		
		
		/**
		 * Commits the data in the DataComponent, so that it is no longer considered "modified".
		 * 
		 * @abstract
		 * @method commit
		 */
		commit : Class.abstractMethod,
		
		
		/**
		 * Rolls the data in the DataComponent back to its state before the last {@link #commit}
		 * or rollback.
		 * 
		 * @abstract
		 * @method rollback
		 */
		rollback : Class.abstractMethod,
		
		
		/**
		 * Gets the {@link #proxy} that is currently configured for this DataComponent. Note that
		 * the same proxy instance is shared between all instances of the DataComponent.
		 * 
		 * @return {data.persistence.proxy.Proxy} The configured persistence proxy, or `null` if there is none configured.
		 */
		getProxy : function() {
			return this.proxy;
		}
		
	} );
	
	return DataComponent;
	
} );
/*global define */
define('data/persistence/ResultSet', [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class data.persistence.ResultSet
	 * @extends Object
	 * 
	 * Simple wrapper which holds the data returned by any {@link data.persistence.proxy.Proxy Proxy} 
	 * operation, along with any metadata such as the total number of data records in a windowed 
	 * data set.
	 */
	var Reader = Class.extend( Object, {
		
		/**
		 * @cfg {Object/Object[]} records
		 * 
		 * One or more data records that have been returned by a {@link data.persistence.proxy.Proxy Proxy}, 
		 * after they have been converted to plain JavaScript objects by a 
		 * {@link data.persistence.reader.Reader Reader}.
		 */
		
		/**
		 * @cfg {Number} totalCount
		 * 
		 * Metadata for the total number of records in the data set. This is used for windowed (paged) 
		 * data sets, and will be the total number of records available on the storage medium (ex: a 
		 * server database). 
		 */
		
		/**
		 * @cfg {String} message
		 * 
		 * Any message metadata for the ResultSet.
		 */
		message : "",
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Retrieves the {@link #records} in this ResultSet.
		 * 
		 * @return {Object[]}
		 */
		getRecords : function() {
			var records = this.records;
			
			// Convert a single object into an array
			if( records && !_.isArray( records ) ) {
				this.records = records = [ records ];
			}
			return records || (this.records = []);   // no records provided, return empty array
		},
		
		
		/**
		 * Retrieves the {@link #totalCount}, which is the total number of records in a windowed (paged)
		 * data set. If the {@link #totalCount} config was not provided, this method will return `undefined`.
		 * 
		 * To find the number of records in this particular ResultSet, use {@link #getRecords} method 
		 * and check the `length` property.
		 * 
		 * @return {Number} The total count read by a {@link data.persistence.reader.Reader Reader}, or
		 *   `undefined` if no such value was read.
		 */
		getTotalCount : function() {
			return this.totalCount;
		},
		
		
		/**
		 * Retrieves the {@link #message}, if there is any.
		 * 
		 * @return {String}
		 */
		getMessage : function() {
			return this.message;
		}
		
	} );
	
	return Reader;
	
} );
/*global define */
/*jshint boss:true */
define('data/persistence/reader/Reader', [
	'lodash',
	'Class',
	'data/persistence/ResultSet'
], function( _, Class, ResultSet ) {
	
	/**
	 * @abstract
	 * @class data.persistence.reader.Reader
	 * @extends Object
	 * 
	 * The purpose of a Reader is to read raw data pulled in by a {@link data.persistence.proxy.Proxy}, and convert
	 * it into a form which can be directly consumed by a {@link data.Model Model} or {@link data.Collection Collection}.
	 * 
	 * Each Reader subclass must implement the {@link #convertRaw} method, which is provided the raw data,
	 * and is expected to return a JavaScript object with the record(s) data and any metadata that exists in 
	 * the raw data. A "record" is defined simply as a plain JavaScript object that holds the properties and 
	 * values for a {@link data.Model} model on the client-side app.
	 * 
	 * Reader subclasses may override certain methods such as {@link #processRecords} or {@link #processRecord}
	 * to apply transformations from the raw data to a form that will be consumed by a {@link data.Model Model}
	 * or {@link data.Collection Collection}.
	 */
	var Reader = Class.extend( Object, {
		abstractClass : true,
		
		
		/**
		 * @cfg {String} dataProperty
		 * 
		 * The name of the property which contains the data record(s) from the raw data. This may be a 
		 * dot-delimited string to a nested property, if applicable. If the property has a dot (period)
		 * as part of the name, it may be escaped with a backslash, which should be a double backslash inside
		 * a string literal (ex: "data\\.property"). 
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * Defaults to '.', meaning the record(s) data is at the root level of the data.
		 */
		dataProperty : '.',
		
		/**
		 * @cfg {String} totalProperty
		 * 
		 * The name of the property (if there is one) which holds the metadata for the total number of records 
		 * on the backing collection (such as a server-side database). This is used for loading windowed (paged) 
		 * datasets, and is only needed if not loading all of the data at once.
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * This may be a dot-delimited string to a nested property, if applicable. If the property has a dot (period)
		 * as part of the name, it may be escaped with a backslash, which should be a double backslash inside
		 * a string literal (ex: "metadata\\.total"). If left as an empty string, no total count metadata will be read.
		 */
		totalProperty : '',
		
		/**
		 * @cfg {String} messageProperty
		 * 
		 * The name of the property (if there is one) which holds an optional message to be stored with the 
		 * {@link data.persistence.ResultSet ResultSet} that is returned from the {@link #read} method.
		 * 
		 * This property name references the data when it is in JavaScript object form, *after* it has been 
		 * converted by the {@link #convertRaw} method.
		 * 
		 * This may be a dot-delimited string to a nested property, if applicable. If the property has a dot (period)
		 * as part of the name, it may be escaped with a backslash, which should be a double backslash inside
		 * a string literal (ex: "metadata\\.message"). If left as an empty string, no message metadata will be read. 
		 */
		messageProperty : '',
		
		/**
		 * @cfg {Object} dataMappings
		 * 
		 * An Object which maps raw data property names to the target {@link data.Model#cfg-attributes attribute} 
		 * names of the {@link data.Model} which will be populated as a result of the {@link #read}.
		 * 
		 * For example, if we have a model defined as such:
		 * 
		 *     var Person = Model.extend( {
		 *         attributes : [ 'id', 'name' ]
		 *     } );
		 * 
		 * And the raw data that comes from a server (after being transformed by {@link #convertRaw} into a plain
		 * JavaScript object) looks like this:
		 * 
		 *     {
		 *         personId   : 10,
		 *         personName : "John Smith"
		 *     }
		 * 
		 * Then we could set the `dataMappings` property to be the following, to automatically map the data to the
		 * correct target property (attribute) names:
		 * 
		 *     dataMappings : {
		 *         'personId'   : 'id',
		 *         'personName' : 'name'
		 *     }
		 * 
		 * 
		 * The key names in this map are the raw data property names, and the values are the target property 
		 * (attribute) names. Note that all raw properties do not need to be specified; only the ones you want 
		 * mapped.
		 * 
		 * 
		 * ### Mapping to Nested Objects
		 * 
		 * The key names in the map may be a dot-delimited path to a nested object in the data record. Using the above
		 * `Person` model, say we were reading raw data that looked like this:
		 * 
		 *     {
		 *         personId : 10,
		 *         personInfo : {
		 *             name : "John Smith"
		 *         }
		 *     }
		 *     
		 * The `dataMappings` config to read this raw data would then look like this:
		 * 
		 *     dataMappings : {
		 *         'personId'        : 'id',
		 *         'personInfo.name' : 'name',
		 *         
		 *         'personInfo' : ''  // note, nested objects which have properties mapped to them are not automatically
		 *                            // removed (yet), so remove it manually by setting this top level key to an empty string. 
		 *                            // See "Removing Unneeded Source Properties" below.
		 *     }
		 * 
		 * 
		 * #### Escaping for Dots ('.') in the Raw Property Name
		 * 
		 * If there are properties in the raw data that have dots (periods) as part of their names, then the dots in the 
		 * mappings may be escaped with a backslash. However, in string literals in the map, this must be a double backslash
		 * to get the actual backslash character. Say we were consuming this raw data:
		 * 
		 *     {
		 *         'person.id'   : 10,
		 *         'person.name' : "John Smith"
		 *     }
		 * 
		 * Then our `dataMappings` would look like this:
		 * 
		 *     dataMappings : {
		 *         'person\\.id'   : 'id',
		 *         'person\\.name' : 'name'
		 *     }
		 * 
		 * 
		 * ### Removing Unneeded Source Properties
		 * 
		 * There is a special form for removing source data properties that are unneeded, so that they do not get 
		 * set to the target {@link data.Model} (which by default, would throw an error for an unknown attribute). 
		 * Setting the value in the map to an empty string will remove the particular source data property as part 
		 * of the mapping process. Ex:
		 * 
		 *     dataMappings : {
		 *         'personId'   : 'id',
		 *         'personName' : 'name',
		 *         
		 *         'lastDentalAppointmentDate' : ''  // we don't need this... remove this property from the raw data
		 *                                           // so it doesn't attempt to be set to our Person model
		 *     }
		 *     
		 *     
		 * ### More Advanced Transformations
		 * 
		 * If you need more advanced transformations than the `dataMappings` config provides, override the 
		 * {@link #processRecord} method in a subclass. See {@link #processRecord} for details. 
		 */
		
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
		},
		
		
		/**
		 * Reads the raw data, and returns a {@link data.persistence.ResultSet} object which holds the data
		 * in JavaScript object form, along with any metadata present.
		 * 
		 * @param {Mixed} rawData The raw data to transform.
		 * @return {data.persistence.ResultSet} A ResultSet object which holds the data in JavaScript object form,
		 *   and any associated metadata that was present in the `rawData`.
		 */
		read : function( rawData ) {
			var data    = this.convertRaw( rawData ),
			    records = this.extractRecords( data );
			
			records = this.processRecords( records );
			
			return new ResultSet( {
				records    : records,
				totalCount : this.extractTotalCount( data ),
				message    : this.extractMessage( data )
			} );
		},
		
		
		/**
		 * Abstract method which should be implemented to take the raw data, and convert it into
		 * a JavaScript Object.
		 * 
		 * @abstract
		 * @protected
		 * @param {Mixed} rawData
		 * @return {Object}
		 */
		convertRaw : Class.abstractMethod,
		

		/**
		 * Extracts the records data from the JavaScript object produced as a result of {@link #convertRaw}.
		 * The default implementation uses the {@link #dataProperty} config to pull out the object which holds
		 * the record(s) data.
		 * 
		 * @param {Object} data The JavaScript form of the raw data (converted by {@link #convertRaw}).
		 * @return {Object[]} The data records. If a single record is found, it is wrapped in an array
		 *   (forming a one element array).
		 */
		extractRecords : function( data ) {
			var dataProperty = this.dataProperty;
			if( dataProperty && dataProperty !== '.' ) {
				data = this.findPropertyValue( data, dataProperty );

				// <debug>
				if( data === undefined ) {
					throw new Error( "Reader could not find the data at property '" + dataProperty + "'" );
				}
				// </debug>
			}
			
			return ( _.isArray( data ) ) ? data : [ data ];  // Wrap in an array if it is a single object 
		},
		
		
		/**
		 * Extracts the total count metadata (if any) from the JavaScript object produced as a result of 
		 * {@link #convertRaw}. The default implementation uses the {@link #totalProperty} config to pull 
		 * out and return the totalCount value.
		 * 
		 * @param {Object} data The JavaScript form of the raw data (converted by {@link #convertRaw}).
		 * @return {Number} The total count. Returns `undefined` if no total count metadata property 
		 *   was found.
		 */
		extractTotalCount : function( data ) {
			var totalProperty = this.totalProperty;
			if( totalProperty ) {
				var totalCount = this.findPropertyValue( data, totalProperty );
				
				// <debug>
				if( totalCount === undefined ) {
					throw new Error( "Reader could not find the total count property '" + totalProperty + "' in the data." );
				}
				// </debug>
				return parseInt( totalCount, 10 );
			}
		},

		
		/**
		 * Extracts the message metadata (if any) from the JavaScript object produced as a result of 
		 * {@link #convertRaw}. The default implementation uses the {@link #messageProperty} config to pull 
		 * out and return the message.
		 * 
		 * @param {Object} data The JavaScript form of the raw data (converted by {@link #convertRaw}).
		 * @return {String} The message metadata, if any. Returns `undefined` if none was found.
		 */
		extractMessage : function( data ) {
			var messageProperty = this.messageProperty;
			if( messageProperty ) {
				var message = this.findPropertyValue( data, messageProperty );
				
				// <debug>
				if( message === undefined ) {
					throw new Error( "Reader could not find the message property '" + messageProperty + "' in the data." );
				}
				// </debug>
				return message;
			}
		},
		
		
		/**
		 * Hook method which may be overridden to process the list of records in the data.
		 * This method, by default, simply calls {@link #processRecord} with each record in
		 * the data, but may be overridden to apply transformations to the records list as
		 * a whole. If your intention is to transform each record (model) one by one, override
		 * {@link #processRecord} instead.
		 * 
		 * @protected
		 * @template
		 * @param {Object[]} records
		 * @return {Object[]} The `records` with any transformations applied.
		 */
		processRecords : function( records ) {
			for( var i = 0, len = records.length; i < len; i++ ) {
				records[ i ] = this.processRecord( records[ i ] );
			}
			return records;
		},
		
		
		/**
		 * Hook method which may be overridden to process the data of a single record.
		 * This method, by default, applies any data mappings specified in a {@link #dataMappings}
		 * config (by calling {@link #applyDataMappings}, and then returns the newly transformed record 
		 * object. If overriding this method in a subclass, call this superclass method when you want 
		 * the {@link #dataMappings} to be applied (and any other future config-driven transformations
		 * that may be implemented).
		 * 
		 * This method, by default, is called once for each record in the data. This is unless 
		 * {@link #processRecords} has been redefined in a subclass, and the records are handled 
		 * differently.
		 * 
		 * @protected
		 * @template
		 * @param {Object} recordData
		 * @return {Object} The `recordData` with any transformations applied.
		 */
		processRecord : function( recordData ) {
			return this.applyDataMappings( recordData );
		},
		
		
		// -----------------------------------
		
		
		/**
		 * Utility method which applies the {@link #dataMappings} to a given record (i.e. the plain
		 * object that holds the properties which will be later set to a {@link data.Model}.
		 * 
		 * This method is by default, executed by {@link #processRecord} (unless {@link #processRecord}
		 * is redefined in a subclass).
		 * 
		 * @protected
		 * @param {Object} recordData
		 * @return {Object} The `recordData` with the {@link #dataMappings} applied.
		 */
		applyDataMappings : function( recordData ) {
			var me = this,  // for closure
			    dataMappings = this.dataMappings;
			
			if( dataMappings ) {
				_.forOwn( dataMappings, function( targetPropName, sourcePropPath ) {
					// Copy value to target property.
					// Empty string target property can be used to simply delete the source data property (which we'll do next),
					// so don't create a new target property in this case
					if( targetPropName !== '' ) {
						recordData[ targetPropName ] = me.findPropertyValue( recordData, sourcePropPath );
					}
					
					// Delete the source property.
					// TODO: implement deleting of nested mapped properties. For now, only deletes top level source properties
					var pathKeys = me.parsePathString( sourcePropPath );
					if( pathKeys.length === 1 ) {  // a top level property
						delete recordData[ pathKeys[ 0 ] ];  // use the pathKeys array, as it will have '\.' sequences processed to '.'
					}
				} );
			}
			return recordData;
		},
		
		
		/**
		 * Utility method which searches for a (possibly nested) property in a data object.
		 * The `propertyName` parameter accepts a dot-delimited string, which accesses a property
		 * deep within the object structure. For example: a `propertyName` of 'foo.bar' will access 
		 * property 'foo' from the `obj` provided, and then the property 'bar' from 'foo'.
		 * 
		 * Dots may be escaped by a backslash (specified as a double backslash in a string literal)
		 * so that property names which have dots within them may be accessed. For example, a
		 * `propertyName` of 'foo\\.bar' will access the property "foo.bar" from the `obj` provided. 
		 * 
		 * @protected
		 * @param {Object} obj The object to search.
		 * @param {String} propertyPath A single property name, or dot-delimited path to access nested properties. 
		 *   Dots escaped with a backslash will be taken as literal dots (i.e. not as nested keys).
		 * @return {Mixed} The value at the `propertyName`. If the property is not found, returns
		 *   `undefined`.
		 */
		findPropertyValue : function( obj, propertyPath ) {
			if( !obj || !propertyPath ) return;
			
			// Walk down the nested object structure for the value
			var pathKeys = this.parsePathString( propertyPath );
			for( var i = 0, len = pathKeys.length; obj && i < len; i++ ) {
				obj = obj[ pathKeys[ i ] ];
			}
			return obj;
		},
		
		
		/**
		 * Utility method to parse a dot-delimited object path string into a list of nested keys. Dots
		 * in the string which are prefixed by a backslash are taken literally. (Note: for escaped dots,
		 * need to specify a double backslash in JS string literals.)
		 * 
		 * Ex:
		 * 
		 *     'prop' -> [ 'prop' ]
		 *     'prop.nested' -> [ 'prop', 'nested' ]
		 *     'prop.nested.deepNested' -> [ 'prop', 'nested', 'deepNested' ]
		 *     'prop\\.value' -> [ 'prop.value' ]
		 *     'prop.nested.namespace\\.value' -> [ 'prop', 'nested', 'namespace.value' ]
		 * 
		 * @protected
		 * @param {String} pathString The dot-delimited path string.
		 * @return {String[]} A list (array) of the nested keys. 
		 */
		parsePathString : function( pathString ) {
			var dotRe = /\./g,    // match all periods
			    dotMatch,
			    escapedDotRe = /\\\./g,
			    pathKeys = [],    // list where each element is a nested property key, each one level below the one before it
			    keyStartIdx = 0;  // for parsing, this is the start of the key that is currently being parsed in the loop
			
			while( dotMatch = dotRe.exec( pathString ) ) {
				var dotMatchIdx = dotMatch.index;
				
				if( pathString.charAt( dotMatchIdx - 1 ) !== "\\" ) {  // a non-escaped period was matched
					var key = pathString.substring( keyStartIdx, dotMatchIdx ).replace( escapedDotRe, '.' );  // replace any '\.' sequences with simply '.' before pushing to the array (i.e. remove the escape sequence)
					pathKeys.push( key );
					
					keyStartIdx = dotMatchIdx + 1;
				}
			}
			var lastKey = pathString.substring( keyStartIdx, pathString.length ).replace( escapedDotRe, '.' );  // replace any \. sequences with simply . before pushing to the array (i.e. remove the escape sequence)
			pathKeys.push( lastKey );  // push the last (or possibly only) key
			
			return pathKeys;
		}
		
	} );
	
	return Reader;
	
} );
/*global define */
define('data/persistence/reader/Json', [
	'jquery',
	'lodash',
	'Class',
	'data/persistence/reader/Reader'
], function( jQuery, _, Class, Reader ) {
	
	/**
	 * @class data.persistence.reader.Json
	 * @extends data.persistence.reader.Reader
	 * 
	 * JSON flavor reader which treats raw text data as JSON, and converts it to a JavaScript
	 * object.
	 * 
	 * See {@link data.persistence.reader.Reader} for more information on readers.
	 */
	var JsonReader = Class.extend( Reader, {
		
		/**
		 * Abstract method which should be implemented to take the raw data, and convert it into
		 * a JavaScript Object.
		 * 
		 * @protected
		 * @param {Mixed} rawData Either a string of JSON, or a JavaScript Object. If a JavaScript
		 *   Object is provided, it will simply be returned.
		 * @return {Object} The resulting Object as a result of parsing the JSON.
		 */
		convertRaw : function( rawData ) {
			var data = rawData;
			
			if( typeof rawData === 'string' ) {
				if( typeof JSON !== 'undefined' && JSON.parse ) { 
					data = JSON.parse( rawData );
				} else {
					data = jQuery.globalEval( '(' + rawData + ')' );
				}
			}
			return data;
		}
		
	} );
	
	return JsonReader;
	
} );
/*global define */
define('data/persistence/proxy/Proxy', [
	'lodash',
	'Class',
	'Observable',
	'data/persistence/reader/Json'
], function( _, Class, Observable, JsonReader ) {
	
	/**
	 * @abstract
	 * @class data.persistence.proxy.Proxy
	 * @extends Observable
	 * 
	 * Proxy is the base class for subclasses that perform CRUD (Create, Read, Update, and Delete) operations on
	 * some sort of persistence medium. This can be a backend server, a webservice, or a local storage data store,
	 * to name a few examples.
	 */
	var Proxy = Class.extend( Observable, {
		abstractClass : true,
		
		
		statics : {
			
			/**
			 * An object (hashmap) of persistence proxy name -> Proxy class key/value pairs, used to look up
			 * a Proxy subclass by name.
			 * 
			 * @private
			 * @static
			 * @property {Object} proxies
			 */
			proxies : {},
			
			/**
			 * Registers a Proxy subclass by name, so that it may be created by an anonymous object
			 * with a `type` attribute when set to the prototype of a {@link data.Model}.
			 *
			 * @static  
			 * @method register
			 * @param {String} type The type name of the persistence proxy.
			 * @param {Function} proxyClass The class (constructor function) to register.
			 */
			register : function( type, proxyClass ) {
				type = type.toLowerCase();
				if( typeof proxyClass !== 'function' ) {
					throw new Error( "A Proxy subclass constructor function must be provided to registerProxy()" );
				}
				
				if( !Proxy.proxies[ type ] ) { 
					Proxy.proxies[ type ] = proxyClass;
				} else {
					throw new Error( "Error: Proxy type '" + type + "' already registered." );
				}
			},
			
			
			/**
			 * Creates (instantiates) a {@link data.persistence.proxy.Proxy} based on its type name, given
			 * a configuration object that has a `type` property. If an already-instantiated 
			 * {@link data.persistence.proxy.Proxy Proxy} is provided, it will simply be returned unchanged.
			 * 
			 * @static
			 * @method create
			 * @param {Object} config The configuration object for the Proxy. Config objects should have the property `type`, 
			 *   which determines which type of {@link data.persistence.proxy.Proxy} will be instantiated. If the object does not
			 *   have a `type` property, an error will be thrown. Note that already-instantiated {@link data.persistence.proxy.Proxy Proxies} 
			 *   will simply be returned unchanged. 
			 * @return {data.persistence.proxy.Proxy} The instantiated Proxy.
			 */
			create : function( config ) {
				var type = config.type ? config.type.toLowerCase() : undefined;
				
				if( config instanceof Proxy ) {
					// Already a Proxy instance, return it
					return config;
					
				} else if( Proxy.proxies[ type ] ) {
					return new Proxy.proxies[ type ]( config );
					
				} else if( !( 'type' in config ) ) {
					// No `type` property provided on config object
					throw new Error( "data.persistence.proxy.Proxy.create(): No `type` property provided on proxy config object" );
					 
				} else {
					// No registered Proxy type with the given type, throw an error
					throw new Error( "data.persistence.proxy.Proxy.create(): Unknown Proxy type: '" + type + "'" );
				}
			}
		},
		
		
		/**
		 * @cfg {data.persistence.reader.Reader} reader
		 * 
		 * The reader to use to transform the raw data that is read by the proxy into JavaScript object(s),
		 * so that they can be passed to a {@link data.Model} or {@link data.Collection}.
		 * 
		 * This defaults to a {@link data.persistence.reader.Json Json} reader, as this is the most common
		 * format. However, other implementations may be created and used, which may include method overrides
		 * to apply transformations to incoming data before that data is handed off to a {@link data.Model Model}
		 * or {@link data.Collection Collection}.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
			
			if( !this.reader ) {
				this.reader = new JsonReader();
			}
		},
		
		
		/**
		 * Creates a Model on the persistent storage.
		 * 
		 * @abstract
		 * @method create
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance to represent
		 *   the creation on the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		create : Class.abstractMethod,
		
		
		/**
		 * Reads a Model from the server.
		 * 
		 * @abstract
		 * @method read
		 * @param {data.persistence.operation.Read} operation The ReadOperation instance to represent
		 *   the reading of data from the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		read : Class.abstractMethod,
		
		
		/**
		 * Updates the Model on the server, using the provided `data`.  
		 * 
		 * @abstract
		 * @method update
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance to represent
		 *   the update on the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		update : Class.abstractMethod,
		
		
		/**
		 * Destroys (deletes) the Model on the server. This method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @abstract
		 * @method destroy
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance to represent
		 *   the destruction (deletion) on the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		destroy : Class.abstractMethod
		
	} );
	
	return Proxy;
	
} );
/*global define */
define('data/persistence/operation/Operation', [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class data.persistence.operation.Operation
	 * 
	 * Represents an operation for a {@link data.persistence.proxy.Proxy} to carry out. This class basically represents 
	 * any CRUD operation to be performed, passes along any options needed for that operation, and accepts any data/state
	 * as a result of that operation. 
	 * 
	 * Operation's subclasses are split into two distinct implementations:
	 * 
	 * - {@link data.persistence.operation.Read}: Represents an Operation to read (load) data from persistence storage.
	 * - {@link data.persistence.operation.Write}: Represents an Operation to write (store) data to persistence storage.
	 *   This includes destroying (deleting) models as well.
	 * 
	 * This class is used internally by the framework when making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} operations 
	 * complete, so information can be obtained about the operation that took place.
	 */
	var Operation = Class.extend( Object, {
		
		/**
		 * @cfg {Object} params
		 * 
		 * A map of any parameters to pass along for the Operation. These parameters will be interpreted by the
		 * particular {@link data.persistence.proxy.Proxy} that is being used. For example, the 
		 * {@link data.persistence.proxy.Ajax Ajax} proxy appends them as URL parameters for the request.
		 * 
		 * Example:
		 * 
		 *     params : {
		 *         param1: "value1",
		 *         param2: "value2
		 *     }
		 */
		
		
		/**
		 * @protected
		 * @property {data.persistence.ResultSet} resultSet
		 * 
		 * A ResultSet object which contains any data read by the Operation. This object contains any 
		 * returned data, as well as any metadata (such as the total number of records in a paged data set).
		 * This object is set by a {@link data.persistence.proxy.Proxy} when it finishes its routine, and can be 
		 * retrieved via {@link #getResultSet}. Some notes:
		 * 
		 * - For cases of read operations, this object will contain the data that is read by the operation.
		 * - For cases of write operations, this object will contain any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model after it is saved (say, with some computed attributes, or a generated 
		 *   id attribute), then the ResultSet will contain that data.
		 */
		
		
		/**
		 * @private
		 * @property {Boolean} success
		 * 
		 * Property which is set to true upon successful completion of the Operation. Read
		 * this value with {@link #wasSuccessful}.
		 */
		success : false,
		
		/**
		 * @private
		 * @property {Boolean} error
		 * 
		 * Property which is set to true upon failure to complete the Operation. Read this value
		 * with {@link #hasErrored}.
		 */
		error : false,
		
		/**
		 * @private
		 * @property {String/Object} exception
		 * 
		 * An object or string describing the exception that occurred. Set when {@link #setException}
		 * is called.
		 */
		exception : null,
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
		},
		
		
		/**
		 * Retrieves the {@link #params} for this Operation. Returns an empty
		 * object if no params were provided.
		 * 
		 * @return {Object}
		 */
		getParams : function() {
			return ( this.params || (this.params = {}) );
		},
		
		
		/**
		 * Accessor for a Proxy to set a ResultSet which contains the data that is has read, 
		 * once the operation completes.
		 * 
		 * @param {data.persistence.ResultSet} resultSet A ResultSet which contains the data and any metadata read by 
		 *   the Proxy.
		 */
		setResultSet : function( resultSet ) {
			this.resultSet = resultSet;
		},
		
		
		/**
		 * Retrieves the {@link data.persistence.ResultSet} containing any data and metadata read by the 
		 * Operation. This is set by a {@link data.persistence.proxy.Proxy} when it finishes its routine.  
		 * 
		 * - For cases of read operations, this object will contain the data that is read by the operation.
		 * - For cases of write operations, this object will contain any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model after it is saved (say, with some computed attributes, or a generated 
		 *   id attribute), then the ResultSet will contain that data.
		 * 
		 * @return {data.persistence.ResultSet} The ResultSet read by the Proxy, or null if one has not been set.
		 */
		getResultSet : function() {
			return this.resultSet;
		},
		
		
		/**
		 * Marks the Operation as successful.
		 */
		setSuccess : function() {
			this.success = true;
		},
		
		
		/**
		 * Determines if the Operation completed successfully.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return this.success;
		},
		
		
		/**
		 * Marks the Operation as having errored, and sets an exception object that describes the exception
		 * that has occurred.
		 * 
		 * @param {String/Object} exception An object or string describing the exception that occurred.
		 */
		setException : function( exception ) {
			this.error = true;
			this.exception = exception;
		},
		
		
		/**
		 * Retrieves any exception object attached for an errored Operation.
		 * 
		 * @return {String/Object} The {@link #exception} object or string which describes
		 *   the exception that occurred for an errored Operation.
		 */
		getException : function() {
			return this.exception;
		},
		
		
		/**
		 * Determines if the Operation failed to complete successfully.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return this.error;
		},
		
		
		/**
		 * Determines if the Operation is complete.
		 * 
		 * @return {Boolean}
		 */
		isComplete : function() {
			return this.success || this.error;
		}
		
	} );
	
	return Operation;
	
} );
/*global define */
define('data/persistence/operation/Read', [
	'lodash',
	'Class',
	'data/persistence/operation/Operation'
], function( _, Class, Operation ) {
	
	/**
	 * @class data.persistence.operation.Read
	 * @extends data.persistence.operation.Operation
	 * 
	 * Represents a read operation from a persistent storage mechanism. 
	 * 
	 * This class is used internally by the framework when making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} operations 
	 * complete.
	 */
	var ReadOperation = Class.extend( Operation, {
		
		/**
		 * @cfg {Number/String} modelId
		 * 
		 * A single model ID to load. This is only used for loading a single {@link data.Model Model}.
		 * If this value is not provided, it will be assumed to load a collection of models.
		 */
		
		/**
		 * @cfg {Number} page
		 * 
		 * When loading a page of a paged data set, this is the 1-based page number to load.
		 */
		
		/**
		 * @cfg {Number} pageSize
		 * 
		 * When loading a page of a paged data set, this is size of the page. Used in conjunction
		 * with the {@link #page} config.
		 */
		
		/**
		 * @cfg {Number} start
		 * 
		 * The start index of where to load models from. Used for when loading paged sets of data
		 * in a {@link data.Collection Collection}.
		 */
		start : 0,
		
		/**
		 * @cfg {Number} limit
		 * 
		 * The number of models to load. Used in conjunction with the {@link #start} config.
		 * 
		 * Defaults to 0, for "no limit"
		 */
		limit : 0,
		
		
		/**
		 * Retrieves the value of the {@link #modelId} config, if it was provided.
		 * If it was not provided, returns `null`.
		 * 
		 * @return {Number/String} The {@link #modelId} provided as a config, or `null` if the config 
		 *   was not provided.
		 */
		getModelId : function() {
			return ( this.modelId !== undefined ) ? this.modelId : null;
		},
		
		
		/**
		 * Retrieves the value of the {@link #page} config. Will return `undefined` if no {@link #page}
		 * config has been provided.
		 * 
		 * @return {Number}
		 */
		getPage : function() {
			return this.page;
		},
		
		
		/**
		 * Retrieves the value of the {@link #pageSize} config. Will return `undefined` if no {@link #pageSize}
		 * config has been provided.
		 * 
		 * @return {Number}
		 */
		getPageSize : function() {
			return this.pageSize;
		},
		
		
		/**
		 * Retrieves the value of the {@link #start} config.
		 * 
		 * @return {Number}
		 */
		getStart : function() {
			return this.start;
		},
		
		
		/**
		 * Retrieves the value of the {@link #limit} config.
		 * 
		 * @return {Number}
		 */
		getLimit : function() {
			return this.limit;
		}
		
	} );
	
	return ReadOperation;
	
} );
/*global define */
define('data/persistence/operation/Write', [
	'lodash',
	'Class',
	'data/persistence/operation/Operation'
], function( _, Class, Operation ) {
	
	/**
	 * @class data.persistence.operation.Write
	 * @extends data.persistence.operation.Operation
	 * 
	 * Represents a write operation to a persistent storage mechanism. This includes creating, updating, or destroying
	 * (deleting) models on the persistent storage.
	 * 
	 * This class is used internally by the framework when making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} operations 
	 * complete.
	 */
	var WriteOperation = Class.extend( Operation, {
		
		/**
		 * @cfg {data.Model[]} models
		 * 
		 * The models to write during the WriteOperation.
		 */
		
		
		/**
		 * Retrieves the {@link #models} provided for this WriteOperation.
		 * 
		 * @return {data.Model[]}
		 */
		getModels : function() {
			return ( this.models || (this.models = []) );
		}
		
	} );
	
	return WriteOperation;
	
} );
/*global define */
define('data/attribute/Attribute', [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class data.attribute.Attribute
	 * @extends Object
	 * 
	 * Base attribute definition class for {@link data.Model Models}. The Attribute itself does not store data, but instead simply
	 * defines the behavior of a {@link data.Model Model's} attributes. A {@link data.Model Model} is made up of Attributes. 
	 * 
	 * Note: You will most likely not instantiate Attribute objects directly. This is used by {@link data.Model} with its
	 * {@link data.Model#cfg-attributes attributes} prototype config. Anonymous config objects provided to {@link data.Model#cfg-attributes attributes}
	 * will be passed to the Attribute constructor.
	 */
	var Attribute = Class.extend( Object, {
		abstractClass: true,
		
		
		statics : {
			
			/**
			 * An object (hashmap) which stores the registered Attribute types. It maps type names to Attribute subclasses.
			 * 
			 * @private
			 * @static
			 * @property {Object} attributeTypes
			 */
			attributeTypes : {},
			
			
			/**
			 * Static method to instantiate the appropriate Attribute subclass based on a configuration object, based on its `type` property.
			 * 
			 * @static
			 * @method create
			 * @param {Object} config The configuration object for the Attribute. Config objects should have the property `type`, 
			 *   which determines which type of Attribute will be instantiated. If the object does not have a `type` property, it will default 
			 *   to `mixed`, which accepts any data type, but does not provide any type checking / data consistency. Note that already-instantiated 
			 *   Attributes will simply be returned unchanged. 
			 * @return {data.attribute.Attribute} The instantiated Attribute.
			 */
			create : function( config ) {
				var type = config.type ? config.type.toLowerCase() : undefined;
			
				if( config instanceof Attribute ) {
					// Already an Attribute instance, return it
					return config;
					
				} else if( this.hasType( type || "mixed" ) ) {
					return new this.attributeTypes[ type || "mixed" ]( config );
					
				} else {
					// No registered type with the given config's `type`, throw an error
					throw new Error( "data.attribute.Attribute: Unknown Attribute type: '" + type + "'" );
				}
			},
			
			
			/**
			 * Static method used to register implementation Attribute subclass types. When creating an Attribute subclass, it 
			 * should be registered with the Attribute superclass (this class), so that it can be instantiated by a string `type` 
			 * name in an anonymous configuration object. Note that type names are case-insensitive.
			 * 
			 * This method will throw an error if a type name is already registered, to assist in making sure that we don't get
			 * unexpected behavior from a type name being overwritten.
			 * 
			 * @static
			 * @method registerType
			 * @param {String} typeName The type name of the registered class. Note that this is case-insensitive.
			 * @param {Function} jsClass The Attribute subclass (constructor function) to register.
			 */
			registerType : function( type, jsClass ) {
				type = type.toLowerCase();
				
				if( !this.attributeTypes[ type ] ) { 
					this.attributeTypes[ type ] = jsClass;
				} else {
					throw new Error( "Error: Attribute type '" + type + "' already exists" );
				}
			},
			
			
			/**
			 * Retrieves the Component class (constructor function) that has been registered by the supplied `type` name. 
			 * 
			 * @method getType
			 * @param {String} type The type name of the registered class.
			 * @return {Function} The class (constructor function) that has been registered under the given type name.
			 */
			getType : function( type ) {
				return this.attributeTypes[ type.toLowerCase() ];
			},
			
			
			/**
			 * Determines if there is a registered Attribute type with the given `typeName`.
			 * 
			 * @method hasType
			 * @param {String} typeName
			 * @return {Boolean}
			 */
			hasType : function( typeName ) {
				if( !typeName ) {  // any falsy type value given, return false
					return false;
				} else {
					return !!this.attributeTypes[ typeName.toLowerCase() ];
				}
			}
			
		}, // end statics
		
		
		// -------------------------------------
		
		
		/**
		 * @cfg {String} name (required)
		 * The name for the attribute, which is used by the owner Model to reference it.
		 */
		name : "",
		
		/**
		 * @cfg {String} type
		 * Specifies the type of the Attribute, in which a conversion of the raw data will be performed.
		 * This accepts the following general types, but custom types may be added using the {@link data.attribute.Attribute#registerType} method.
		 * 
		 * - {@link data.attribute.Mixed mixed}: Performs no conversions, and no special processing of given values. This is the default Attribute type (not recommended).
		 * - {@link data.attribute.String string}
		 * - {@link data.attribute.Integer int} / {@link data.attribute.Integer integer}
		 * - {@link data.attribute.Float float} (really a "double")
		 * - {@link data.attribute.Boolean boolean} / {@link data.attribute.Boolean bool}
		 * - {@link data.attribute.Date date}
		 * - {@link data.attribute.Model model}
		 * - {@link data.attribute.Collection collection}
		 */
		
		/**
		 * @cfg {Mixed/Function} defaultValue
		 * 
		 * The default value to set to the Attribute, when the Attribute is given no initial value.
		 *
		 * If the `defaultValue` is a function, the function will be executed each time a {@link data.Model Model} is created, and its return 
		 * value is used as the `defaultValue`. This is useful, for example, to assign a new unique number to an attribute of a {@link data.Model Model}. 
		 * Ex:
		 * 
		 *     require( [
		 *         'lodash',   // assuming Lo-Dash (or alternatively, Underscore.js) is available
		 *         'data/Model'
		 *     ], function( _, Model ) {
		 *     
		 *         MyModel = Model.extend( {
		 *             attributes : [
		 *                 {
		 *                     name: 'uniqueId', 
		 *                     defaultValue: function() {
		 *                         return _.uniqueId();
		 *                     }
		 *                 }
		 *             ]
		 *         } );
		 *     
		 *     } );
		 * 
		 * Note that the function is called in the scope of the Attribute, which may be used to read the Attribute's own properties/configs,
		 * or call its methods.
		 */
		
		/**
		 * @cfg {Function} set
		 * 
		 * A function that can be used to implement any custom processing needed to convert the raw value provided to the attribute to 
		 * the value which will ultimately be stored on the {@link data.Model Model}. Only provide this config if you want to override
		 * the default {@link #convert} function which is used by the Attribute (or Attribute subclass). 
		 * 
		 * This function is passed the following arguments:
		 * 
		 * - **model** : {@link data.Model}
		 *   
		 *   The Model for which a value to the Attribute is being set.
		 *   
		 * - **newValue** : Mixed
		 *   
		 *   The provided new data value to the attribute. If the attribute has no initial data value, its {@link #defaultValue}
		 *   will be provided to this argument upon instantiation of the {@link data.Model Model}.
		 *   
		 * - **oldValue** : Mixed
		 *   
		 *   The old value that the attribute held (if any).
		 * 
		 * 
		 * The function should do any processing that is necessary, and return the value that the Model should hold for the value. 
		 * For example, this `set` function will convert a string value to a JavaScript
		 * <a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date" target="_blank">Date</a>
		 * object. Otherwise, it will return the value unchanged:
		 * 
		 *     {
		 *         name : 'myDateAttr',
		 *         
		 *         set : function( model, newValue, oldValue ) {
		 *             if( typeof newValue === 'string' ) {
		 *                 newValue = new Date( newValue );
		 *             }
		 *             return newValue;
		 *         }
		 *     }
		 * 
		 * If you are using an Attribute subclass (such as the {@link data.attribute.String StringAttribute}), and you want to call the
		 * original {@link #convert} function that is defined, as well as add your own conversion processing, you can do so by simply
		 * calling `this.convert( newValue )` in your `set` function. Ex:
		 * 
		 *     {
		 *         name : 'trimmedName',
		 *         type : 'string',
		 *         
		 *         set : function( model, newValue ) {
		 *             newValue = this.convert( newValue );  // make sure it's been converted to a string, using all of the rules defined in the StringAttribute
		 *             
		 *             return ( newValue.length > 50 ) ? newValue.substr( 0, 47 ) + '...' : newValue;   // this would most likely be a View detail in a real application, but demonstrates the capability
		 *         }
		 *     }
		 * 
		 * 
		 * ## Computed Attributes
		 * 
		 * The `set` function can also be used to set other attributes of a "computed" attribute. Ex:
		 * 
		 *     {
		 *         // A "computed" attribute which combines the 'firstName' and 'lastName' attributes in this model 
		 *         // (assuming they are there)
		 *         name : 'fullName',
		 *         
		 *         set : function( model, newValue, oldValue ) {
		 *             // Setter which takes the first and last name given (such as "John Smith"), and splits them up into 
		 *             // their appropriate parts, to set the appropriate "source" attributes for the computed attribute.
		 *             var names = newValue.split( ' ' );  // split on the space between first and last name
		 *             
		 *             model.set( 'firstName', names[ 0 ] );
		 *             model.set( 'lastName', names[ 1 ] );
		 *         },
		 * 
		 *         get : function( model, value ) {
		 *             // Combine firstName and lastName "source" attributes for the computed attribute's return
		 *             return model.get( 'firstName' ) + " " + model.get( 'lastName' );
		 *         }
		 *     }
		 * 
		 * For the general case of querying other Attributes for their value, be careful in that they may not be set to the expected value 
		 * when this `set` function executes. For creating computed Attributes that rely on other Attributes' values, use a {@link #cfg-get} 
		 * function instead.
		 * 
		 * ## Notes:
		 * 
		 * - Both a `set` and a {@link #get} function can be used in conjunction.
		 * - The `set` function is called upon instantiation of the {@link data.Model Model} if the Model is passed an initial value
		 *   for the Attribute, or if the Attribute has a {@link #defaultValue}.
		 * - The `set` function is called in the scope of the Attribute, so any properties or methods of the Attribute may be referenced.
		 */
		
		/**
		 * @cfg {Function} get
		 * 
		 * A function that can be used to convert the stored value that is held by a Model, when the Model's {@link data.Model#get get} 
		 * method is called for the Attribute. This is useful to create "computed" attributes, which may be created based on other 
		 * Attributes' values. The function is passed the argument of the underlying stored value, and should return the computed value.
		 * 
		 * This function is passed the following arguments:
		 * 
		 * - **model** : {@link data.Model}
		 * 
		 *   The Model for which the value of the Attribute is being retrieved.
		 *   
		 * - **value** : Mixed
		 *   
		 *   The value that the Attribute currently has stored in the {@link data.Model Model}.
		 *
		 * 
		 * For example, if we had a {@link data.Model Model} with `firstName` and `lastName` Attributes, and we wanted to create a `fullName` 
		 * Attribute, this could be done as in the example below.
		 * 
		 *     {
		 *         name : 'fullName',
		 *         
		 *         get : function( model, value ) {  // in this example, the Attribute has no value of its own, so we ignore the `value` arg
		 *             return model.get( 'firstName' ) + " " + model.get( 'lastName' );
		 *         }
		 *     }
		 * 
		 * ## Notes:
		 * 
		 * - Both a `set` and a {@link #get} function can be used in conjunction.
		 * - If the intention is to convert a provided value which needs to be stored on the {@link data.Model Model} in a different way,
		 *   use a {@link #cfg-set} function instead. 
		 * - The `get` function is called in the scope of the Attribute, so any properties or methods of the Attribute may be referenced.
		 */
		
		/**
		 * @cfg {Function} raw
		 * 
		 * A function that can be used to convert an Attribute's value to a raw representation, usually for persisting data on a server.
		 * This function is automatically called (if it exists) when a persistence {@link data.persistence.proxy.Proxy proxy} is collecting
		 * the data to send to the server. The function is passed two arguments, and should return the raw value.
		 * 
		 * @cfg {data.Model} raw.model The Model instance that this Attribute belongs to.
		 * @cfg {Mixed} raw.value The underlying value that the Attribute currently has stored in the {@link data.Model Model}.
		 * 
		 * For example, a Date object is normally converted to JSON with both its date and time components in a serialized string (such
		 * as "2012-01-26T01:20:54.619Z"). To instead persist the Date in m/d/yyyy format, one could create an Attribute such as this:
		 * 
		 *     {
		 *         name : 'eventDate',
		 *         
		 *         set : function( model, value ) { return new Date( value ); },  // so the value is stored as a Date object when used client-side
		 *         raw : function( model, value ) {
		 *             return (value.getMonth()+1) + '/' + value.getDate() + '/' + value.getFullYear();  // m/d/yyyy format 
		 *         }
		 *     }
		 * 
		 * The value that this function returns is the value that is used when the Model's {@link data.Model#raw raw} method is called
		 * on the Attribute.
		 * 
		 * This function is called in the scope of the Attribute, so any properties or methods of the Attribute may be referenced.
		 */
		
		/**
		 * @cfg {Boolean} persist
		 * True if the attribute should be persisted by its {@link data.Model Model} using the Model's {@link data.Model#proxy proxy}.
		 * Set to false to prevent the attribute from being persisted.
		 */
		persist : true,
		
		
		
		/**
		 * Creates a new Attribute instance. Note: You will normally not be using this constructor function, as this class
		 * is only used internally by {@link data.Model}.
		 * 
		 * @constructor 
		 * @param {Object/String} config An Object (map) of the Attribute object's configuration options, which is its definition. 
		 *   Can also be its Attribute {@link #name} provided directly as a string.
		 */
		constructor : function( config ) {
			// If the argument wasn't an object, it must be its attribute name
			if( typeof config !== 'object' ) {
				config = { name: config };
			}
			
			// Copy members of the attribute definition (config) provided onto this object
			_.assign( this, config );
			
			
			// Each Attribute must have a name.
			var name = this.name;
			if( name === undefined || name === null || name === "" ) {
				throw new Error( "no 'name' property provided to data.attribute.Attribute constructor" );
				
			} else if( typeof this.name === 'number' ) {  // convert to a string if it is a number
				this.name = name.toString();
			}
		},
		
		
		/**
		 * Retrieves the name for the Attribute.
		 * 
		 * @return {String}
		 */
		getName : function() {
			return this.name;
		},
		
		
		/**
		 * Retrieves the default value for the Attribute.
		 * 
		 * @return {Mixed}
		 */
		getDefaultValue : function() {
			var defaultValue = this.defaultValue;
			
			if( typeof defaultValue === "function" ) {
				// If the default value is a factory function, execute it and use its return value
				defaultValue = defaultValue.call( this );  // call the function in the scope of this Attribute object
				
			} else if( _.isPlainObject( defaultValue ) ) {
				// If defaultValue is an anonymous object, clone it, to not edit the original object structure
				defaultValue = _.cloneDeep( defaultValue );
			}
			
			return defaultValue;
		},
		
		
		
		/**
		 * Determines if the Attribute should be persisted.
		 * 
		 * @return {Boolean}
		 */
		isPersisted : function() {
			return this.persist;
		},
		
		
		/**
		 * Determines if the Attribute has a user-defined setter (i.e. the {@link #cfg-set set} config was provided).
		 * 
		 * @return {Boolean} True if the Attribute was provided a user-defined {@link #cfg-set set} function. 
		 */
		hasUserDefinedSetter : function() {
			return this.hasOwnProperty( 'set' );
		},
		
		
		/**
		 * Determines if the Attribute has a user-defined getter (i.e. the {@link #cfg-get get} config was provided).
		 * 
		 * @return {Boolean} True if the Attribute was provided a user-defined {@link #cfg-get get} function. 
		 */
		hasUserDefinedGetter : function() {
			return this.hasOwnProperty( 'get' );
		},
		
		
		// ---------------------------
		
		
		/**
		 * Allows the Attribute to determine if two values of its data type are equal, and the model
		 * should consider itself as "changed". This method is passed the "old" value and the "new" value
		 * when a value is {@link data.Model#set set} to the Model, and if this method returns `false`, the
		 * new value is taken as a "change".
		 * 
		 * This may be overridden by subclasses to provide custom comparisons, but the default implementation is
		 * to directly compare primitives, and deep compare arrays and objects.
		 * 
		 * @param {Mixed} oldValue
		 * @param {Mixed} newValue
		 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
		 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
		 */
		valuesAreEqual : function( oldValue, newValue ) {
			return _.isEqual( oldValue, newValue );
		},
		
		
		// ---------------------------
		
		
		/**
		 * Implements the conversion function, if any, for the Attribute or Attribute subclass. By default, this method
		 * simply returns the value unchanged, but subclasses override this to implement their specific data 
		 * conversions.
		 * 
		 * This method is automatically called by the {@link #method-set set method}, unless a {@link #cfg-set set config} 
		 * has been provided to override it. This method may still be called from within a provided {@link #cfg-set set config}
		 * function however, by simply calling `this.convert( newValue )`.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {Mixed} The converted value.
		 */
		convert : function( value ) {
			return value;
		},
		
		
		/**
		 * Method that allows for processing the value that is to be stored for this Attribute on a {@link data.Model}. This method,
		 * by default, calls the {@link #convert} method to do any necessary conversion for the value, dependent on the particular
		 * Attribute subclass in use. However, this method may be overridden by providing a {@link #cfg-set set config}.
		 * 
		 * @param {data.Model} model The Model instance that is providing the value.
		 * @param {Mixed} newValue The new value, which was provided to the Model's {@link data.Model#set set} method.
		 * @param {Mixed} oldValue The old (previous) value that the {@link data.Model Model} held.
		 */
		set : function( model, newValue, oldValue ) {
			return this.convert( newValue );
		},
		
		
		/**
		 * Method that allows for post-processing of the value that is to be set to the {@link data.Model}.
		 * This method is executed after the {@link #method-set set method} (or {@link #cfg-set set config} function, if one was
		 * provided). The `value` provided to this method is the value that has been already processed by {@link #method-set}. 
		 * 
		 * The return value from this method will be the value that is ultimately set as the data for the Attribute on the 
		 * {@link data.Model Model}.
		 * 
		 * Note that the default implementation simply returns the value unchanged, but this may be overridden
		 * in subclasses to provide a post-processing conversion or type check.
		 * 
		 * @param {data.Model} model The Model instance that is providing the value. This is normally not used,
		 *   but is provided in case any model processing is needed.
		 * @param {Mixed} value The value provided to the {@link data.Model#set} method, after it has been processed by either
		 *   the {@link #method-set set method} or any provided {@link #cfg-set set config} function.
		 * @return {Mixed} The converted value.
		 */
		afterSet : function( model, value ) {
			return value;
		}
		
	} );
	
	
	return Attribute;
	
} );

/*global define */
define('data/attribute/Object', [
	'lodash',
	'Class',
	'data/attribute/Attribute'
], function( _, Class, Attribute ) {
	
	/**
	 * @class data.attribute.Object
	 * @extends data.attribute.Attribute
	 * 
	 * Attribute definition class for an Attribute that takes an object value.
	 */
	var ObjectAttribute = Class.extend( Attribute, {
		
		/**
		 * @cfg {Object} defaultValue
		 * @inheritdoc
		 */
		defaultValue : null,
		
		
		/**
		 * Override of superclass method used to normalize the provided `value`. All non-object values are converted to `null`,
		 * while object values are returned unchanged.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {Object}
		 */
		convert : function( value ) {
			value = this._super( arguments );
			
			if( typeof value !== 'object' ) {
				value = null;  // convert all non-object values to null
			}
			
			return value;
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'object', ObjectAttribute );
	
	return ObjectAttribute;
	
} );
/*global define */
/*jshint browser:true */
define('data/attribute/DataComponent', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Object'
], function( _, Class, Attribute, ObjectAttribute ) {
	
	/**
	 * @abstract
	 * @class data.attribute.DataComponent
	 * @extends data.attribute.Object
	 * 
	 * Attribute definition class for an Attribute that allows for a nested {@link data.DataComponent} value.
	 */
	var DataComponentAttribute = Class.extend( ObjectAttribute, {
		abstractClass: true,
		
		
		/**
		 * @cfg {Boolean} embedded
		 * 
		 * Setting this config to true has the parent {@link data.Model Model} treat the child {@link data.DataComponent DataComponent} as if it is a part of itself. 
		 * Normally, a child DataComponent that is not embedded is treated as a "relation", where it is considered as independent from the parent Model.
		 * 
		 * What this means is that, when true:
		 * 
		 * - The parent Model is considered as "changed" when there is a change in the child DataComponent is changed. This Attribute 
		 *   (the attribute that holds the child DataComponent) is the "change".
		 * - The parent Model's {@link data.Model#change change} event is fired when an attribute on the child DataComponent (Model or Collection) has changed.
		 * - The child DataComponent's data is persisted with the parent Model's data, unless the {@link #persistIdOnly} config is set to true,
		 *   in which case just the child DataComponent's {@link data.Model#idAttribute id} is persisted with the parent Model. In the case of a {@link data.Collection},
		 *   the ID's of the models are only persisted if {@link #persistIdOnly} is true.
		 */
		embedded : false,
		
		/**
		 * @cfg {Boolean} persistIdOnly
		 * 
		 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link data.Model#idAttribute id} of the embedded 
		 * model(s) be persisted, rather than all of the Model/Collection data. Normally, when {@link #embedded} is false (the default), the child 
		 * {@link data.DataComponent DataComponent} is treated as a relation, and only its {@link data.Model#idAttribute ids} is/are persisted.
		 */
		persistIdOnly : false,
		
		
		// -------------------------------
		
		
		/**
		 * Determines if the Attribute is an {@link #embedded} Attribute.
		 * 
		 * @return {Boolean}
		 */
		isEmbedded : function() {
			return this.embedded;
		},
		
		
		/**
		 * Utility method to resolve a string path to an object from the global scope to the
		 * actual object.
		 * 
		 * @protected
		 * @param {String} path A string in the form "a.b.c" which will be resolved to the actual `a.b.c` object
		 *   from the global scope (`window`).
		 * @return {Mixed} The value at the given path under the global scope. Returns undefined if the value at the
		 *   path was not found (or this method errors if an intermediate path is not found).
		 */
		resolveGlobalPath : function( path ) {
			var paths = path.split( '.' );
			
			// Loop through the namespaces down to the end of the path, and return the value.
			var value;
			for( var i = 0, len = paths.length; i < len; i++ ) {
				value = ( value || window )[ paths[ i ] ];
			}
			return value;
		}
		
	} );
	
	return DataComponentAttribute;
	
} );

/*global define */
/*jshint newcap:false */  // For the dynamic constructor: new collectionClass( ... );
define('data/attribute/Collection', [
	'require',
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/DataComponent',
	'data/Collection'  // circular dependency, not included in args list
], function( require, _, Class, Attribute, DataComponentAttribute ) {
	
	/**
	 * @class data.attribute.Collection
	 * @extends data.attribute.DataComponent
	 * 
	 * Attribute definition class for an Attribute that allows for a nested {@link data.Collection} value.
	 * 
	 * This class enforces that the Attribute hold a {@link data.Collection Collection} value, or null. However, it will
	 * automatically convert an array of {@link data.Model models} or anonymous data objects into the appropriate 
	 * {@link data.Collection Collection} subclass, using the Collection provided to the {@link #collection} config.
	 * Anonymous data objects in this array will be converted to the model type specified by the {@link #collection collection's} 
	 * {@link data.Collection#model model} config.
	 * 
	 * If the {@link #collection} config is not provided so that automatic data conversion of an array of anonymous objects can
	 * take place, then you must either provide a {@link data.Collection} subclass as the value for the Attribute, or use a custom 
	 * {@link #cfg-set} function to convert any anonymous array into a Collection in the appropriate way. 
	 */
	var CollectionAttribute = Class.extend( DataComponentAttribute, {
			
		/**
		 * @cfg {Array/data.Collection} defaultValue
		 * @inheritdoc
		 * 
		 * Defaults to an empty array, to create an empty Collection of the given {@link #collection} type.
		 */
		//defaultValue : [],  -- Not yet fully implemented on a general level. Can use this in code though.
		
		/**
		 * @cfg {data.Collection/String/Function} collection
		 * 
		 * The specific {@link data.Collection} subclass that will be used in the Collection Attribute. This config is needed
		 * to perform automatic conversion of an array of models or anonymous data objects into the appropriate Collection subclass.
		 * 
		 * This config may be provided as:
		 * 
		 * - A direct reference to a Collection (ex: `myApp.collections.MyCollection`).
		 * - A String which specifies the object path to the Collection, which must be able to be referenced from the global scope. 
		 *   Ex: "myApp.collections.MyCollection".
		 * - A function, which will return a reference to the Collection subclass that should be used. 
		 * 
		 * The reason that this config may be specified as a String or a Function is to allow for "very late binding" to the Collection 
		 * subclass that is used, if the particular {@link data.Collection} subclass is not yet available at the time of Attribute definition.
		 * In this case, the Collection subclass that is used does not need to exist until a value is actually set to the Attribute.
		 * For example, using RequireJS, we may have a circular dependency that needs to be in-line required:
		 *   
		 *     collection : function() {
		 *         return require( 'myApp/collection/MyCollection' );  // will only be resolved once a value is set to the CollectionAttribute
		 *     }
		 */
		
		/**
		 * @cfg {Boolean} embedded
		 * 
		 * Setting this config to `true` has the parent {@link data.Model Model} treat the child {@link data.Collection Collection} as if it is 
		 * a part of itself. Normally, a child Collection that is not embedded is treated as a "relation", where it is considered as independent 
		 * from the parent Model.
		 * 
		 * What this means is that, when true:
		 * 
		 * - The parent Model is considered as "changed" when a model in the child Collection is changed, or one has been added/removed. This Attribute 
		 *   (the attribute that holds the child collection) is the "change".
		 * - The parent Model's {@link data.Model#change change} event is fired when a model on the child Collection has changed, or one has 
		 *   been added/removed.
		 * - The child Collection's model data is persisted with the parent Collection's data, unless the {@link #persistIdOnly} config is set to true,
		 *   in which case just the child Collection's models' {@link data.Model#idAttribute ids} are persisted with the parent Model.
		 */
		
		/**
		 * @cfg {Boolean} persistIdOnly
		 * 
		 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link data.Model#idAttribute id} of the embedded 
		 * collection's models be persisted, rather than all of the collection's model data. Normally, when {@link #embedded} is false (the default), 
		 * the child {@link data.Collection Collection} is treated as a relation, and only its model's {@link data.Model#idAttribute ids} are persisted.
		 */
		persistIdOnly : false,
		
		
		// -------------------------------
		
		
		/**
		 * @constructor
		 */
		constructor : function() {
			this._super( arguments );

			// <debug>
			// Check if the user did not provide a `collection` config, or the value is undefined (which means that they specified
			// a class that either doesn't exist, or doesn't exist yet, and we should give them an error to alert them).
			if( 'collection' in this && this.collection === undefined ) {
				throw new Error( "The `collection` config provided to a Collection Attribute with the name '" + this.getName() + "' either doesn't exist, or doesn't " +
				                 "exist just yet. Consider using the String or Function form of the `collection` config for late binding, if needed." );
			}
			// </debug>
		},
		
		
		/**
		 * Overridden method used to determine if two collections are equal.
		 * @inheritdoc
		 * 
		 * @param {Mixed} oldValue
		 * @param {Mixed} newValue
		 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
		 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
		 */
		valuesAreEqual : function( oldValue, newValue ) {
			// If the references are the same, they are equal. Many collections can be made to hold the same models.
			return oldValue === newValue;
		},
		
		
		/**
		 * Override of superclass method used to convert any arrays into the specified {@link #collection} subclass. The array
		 * will be provided to the {@link #collection} subclass's constructor.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {data.Collection} The Collection.
		 */
		convert : function( value ) {
			// First, call the superclass method to normalize the value to an object, or `null`
			value = this._super( arguments );
			
			if( value !== null ) {
				var collectionClass = this.resolveCollectionClass();
				
				if( value && typeof collectionClass === 'function' && !( value instanceof collectionClass ) ) {
					value = new collectionClass( value );
				}
			}
			
			return value;
		},
		
		
		/**
		 * Overridden `afterSet` method used to subscribe to add/remove/change events on a set child {@link data.Collection Collection}.
		 * 
		 * @inheritdoc
		 */
		afterSet : function( model, value ) {
			var Collection = require( 'data/Collection' );
			
			// Enforce that the value is either null, or a data.Collection
			if( value !== null && !( value instanceof Collection ) ) {
				throw new Error( "A value set to the attribute '" + this.getName() + "' was not a data.Collection subclass" );
			}
			
			return value;
		},
		
		
		/**
		 * Utility method used to retrieve the normalized {@link data.Collection} subclass provided by the {@link #collection} config.
		 * 
		 * - If the {@link #collection} config was provided directly as a class (constructor function), this class is simply returned.
		 * - If the {@link #collection} config was a String, resolve the class (constructor function) by walking down the object tree 
		 *   from the global object.
		 * - If the {@link #collection} config was a Function, resolve the class (constructor function) by executing the function, 
		 *   and taking its return value as the class.
		 * 
		 * If the {@link #collection} config was a String or Function, the resolved class is cached back into the {@link #collection} config
		 * for subsequent calls.
		 * 
		 * @protected
		 * @return {Function} The class (constructor function) for the {@link data.Collection} subclass referenced by the {@link #collection}
		 *   config.
		 */
		resolveCollectionClass : function() {
			var collectionClass = this.collection,
			    Collection = require( 'data/Collection' );  // the Collection constructor function
			
			// Normalize the collectionClass
			if( typeof collectionClass === 'string' ) {
				this.collection = collectionClass = this.resolveGlobalPath( collectionClass );  // changes the string "a.b.c" into the value at `window.a.b.c`
				
				// <debug>
				if( !collectionClass ) {
					throw new Error( "The string value `collection` config did not resolve to a Collection subclass for attribute '" + this.getName() + "'" );
				}
				// </debug>
			} else if( typeof collectionClass === 'function' && !Class.isSubclassOf( collectionClass, Collection ) ) {  // it's not a data.Collection subclass, so it must be an anonymous function. Run it, so it returns the Collection reference we need
				this.collection = collectionClass = collectionClass();
				
				// <debug>
				if( !collectionClass ) {
					throw new Error( "The function value `collection` config did not resolve to a Collection subclass for attribute '" + this.getName() + "'" );
				}
				// </debug>
			}
			
			return collectionClass;
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'collection', CollectionAttribute );
	
	return CollectionAttribute;
	
} );
/*global define */
/*jshint newcap:false */  // For the dynamic constructor: new modelClass( ... );
define('data/attribute/Model', [
	'require',
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/DataComponent',
	'data/Model'  // circular dependency, not included in args list
], function( require, _, Class, Attribute, DataComponentAttribute ) {
	
	/**
	 * @class data.attribute.Model
	 * @extends data.attribute.DataComponent
	 * 
	 * Attribute definition class for an Attribute that allows for a nested {@link data.Model} value.
	 * 
	 * This class enforces that the Attribute hold a {@link data.Model Model} value, or null. However, it will
	 * automatically convert an anonymous data object into the appropriate {@link data.Model Model} subclass, using
	 * the Model constructor function (class) provided to the {@link #model} config. 
	 * 
	 * Otherwise, you must either provide a {@link data.Model} subclass as the value, or use a custom {@link #cfg-set} 
	 * function to convert any anonymous object to a Model in the appropriate way. 
	 */
	var ModelAttribute = Class.extend( DataComponentAttribute, {
		
		/**
		 * @cfg {data.Model/String/Function} model
		 * 
		 * The specific {@link data.Model} subclass that will be used in the Model Attribute. This config can be provided
		 * to perform automatic conversion of anonymous data objects into the appropriate {@link data.Model Model} subclass.
		 * 
		 * This config may be provided as:
		 * 
		 * - A direct reference to a Model (ex: `myApp.models.MyModel`).
		 * - A String which specifies the object path to the Model, which must be able to be referenced from the global scope. 
		 *   Ex: "myApp.models.MyModel".
		 * - A function, which will return a reference to the Model subclass that should be used. 
		 * 
		 * The reason that this config may be specified as a String or a Function is to allow for "very late binding" to the Model 
		 * subclass that is used, if the particular {@link data.Model} subclass is not yet available at the time of Attribute definition.
		 * In this case, the Model subclass that is used does not need to exist until a value is actually set to the Attribute.
		 * For example, using RequireJS, we may have a circular dependency that needs to be in-line required:
		 *   
		 *     model : function() {
		 *         return require( 'myApp/model/MyOtherModel' );  // will only be resolved once a value is set to the ModelAttribute
		 *     }
		 */
		
		/**
		 * @cfg {Boolean} embedded
		 * 
		 * Setting this config to `true` has the parent {@link data.Model Model} treat the child {@link data.Model Model} as if it is a part of itself. 
		 * Normally, a child Model that is not embedded is treated as a "relation", where it is considered as independent from the parent Model.
		 * 
		 * What this means is that, when true:
		 * 
		 * - The parent Model is considered as "changed" when an attribute in the child Model is changed. This Attribute (the attribute that holds the child
		 *   model) is the "change".
		 * - The parent Model's {@link data.Model#change change} event is fired when an attribute on the child Model has changed.
		 * - The child Model's data is persisted with the parent Model's data, unless the {@link #persistIdOnly} config is set to true,
		 *   in which case just the child Model's {@link data.Model#idAttribute id} is persisted with the parent Model.
		 */
		
		/**
		 * @cfg {Boolean} persistIdOnly
		 * 
		 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link data.Model#idAttribute id} of the embedded 
		 * model be persisted, rather than all of the Model data. Normally, when {@link #embedded} is false (the default), the child {@link data.Model Model}
		 * is treated as a relation, and only its {@link data.Model#idAttribute id} is persisted.
		 */
		persistIdOnly : false,
		
		
		// -------------------------------
		
		
		/**
		 * @constructor
		 */
		constructor : function() {
			this._super( arguments );

			// <debug>
			// Check if the user provided a `model`, but the value is undefined. This means that they specified
			// a class that either doesn't exist, or doesn't exist yet, and we should give them a warning.
			if( 'model' in this && this.model === undefined ) {
				throw new Error( "The `model` config provided to a Model Attribute with the name '" + this.getName() + "' either doesn't exist, or doesn't " +
				                 "exist just yet. Consider using the String or Function form of the `model` config for late binding, if needed." );
			}
			// </debug>
		},
		
		
		/**
		 * Overridden method used to determine if two models are equal.
		 * 
		 * @inheritdoc
		 * @param {Mixed} oldValue
		 * @param {Mixed} newValue
		 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
		 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
		 */
		valuesAreEqual : function( oldValue, newValue ) {
			// We can't instantiate two different Models with the same id that have different references, so if the references are the same, they are equal
			return oldValue === newValue;
		},
		
		
		/**
		 * Override of superclass method used to convert any anonymous objects into the specified {@link #model} subclass. The anonymous 
		 * object will be provided to the {@link #model} subclass's constructor.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {data.Model} The Model.
		 */
		convert : function( value ) {
			// First, normalize the value to an object, or `null`
			value = this._super( arguments );
			
			if( value !== null ) {
				var modelClass = this.resolveModelClass();
				
				if( value && typeof modelClass === 'function' && !( value instanceof modelClass ) ) {
					value = new modelClass( value );
				}
			}
			
			return value;
		},
		
		
		/**
		 * Overridden `afterSet` method used to subscribe to change events on a set child {@link data.Model Model}.
		 * 
		 * @inheritdoc
		 */
		afterSet : function( model, value ) {
			var Model = require( 'data/Model' );
			
			// Enforce that the value is either null, or a data.Model
			if( value !== null && !( value instanceof Model ) ) {
				throw new Error( "A value set to the attribute '" + this.getName() + "' was not a data.Model subclass" );
			}
			
			return value;
		},
		
		
		/**
		 * Utility method used to retrieve the normalized {@link data.Model} subclass provided by the {@link #model} config.
		 * 
		 * - If the {@link #model} config was provided directly as a class (constructor function), this class is simply returned.
		 * - If the {@link #model} config was a String, resolve the class (constructor function) by walking down the object tree 
		 *   from the global object.
		 * - If the {@link #model} config was a Function, resolve the class (constructor function) by executing the function, 
		 *   and taking its return value as the class.
		 * 
		 * If the {@link #model} config was a String or Function, the resolved class is cached back into the {@link #model} config
		 * for subsequent calls.
		 * 
		 * @protected
		 * @return {Function} The class (constructor function) for the {@link data.Model} subclass referenced by the {@link #model}
		 *   config.
		 */
		resolveModelClass : function() {
			var modelClass = this.model,
			    Model = require( 'data/Model' );  // the Model constructor function
			
			if( typeof modelClass === 'string' ) {
				this.model = modelClass = this.resolveGlobalPath( modelClass );  // changes the string "a.b.c" into the value at `window.a.b.c`
				
				// <debug>
				if( !modelClass ) {
					throw new Error( "The string value `model` config did not resolve to a Model subclass for attribute '" + this.getName() + "'" );
				}
				// </debug>
			} else if( typeof modelClass === 'function' && !Class.isSubclassOf( modelClass, Model ) ) {  // it's not a data.Model subclass, so it must be an anonymous function. Run it, so it returns the Model reference we need
				this.model = modelClass = modelClass();
				
				// <debug>
				if( !modelClass ) {
					throw new Error( "The function value `model` config did not resolve to a Model subclass for attribute '" + this.getName() + "'" );
				}
				// </debug>
			}
			
			return modelClass;
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'model', ModelAttribute );
	
	return ModelAttribute;
	
} );
/*global define */
define('data/attribute/Primitive', [
	'lodash',
	'Class',
	'data/attribute/Attribute'
], function( _, Class, Attribute ) {
	
	/**
	 * @abstract
	 * @class data.attribute.Primitive
	 * @extends data.attribute.Attribute
	 * 
	 * Base Attribute definition class for an Attribute that holds a JavaScript primitive value 
	 * (i.e. A Boolean, Number, or String).
	 */
	var PrimitiveAttribute = Class.extend( Attribute, {
		abstractClass: true,
		
		/**
		 * @cfg {Boolean} useNull
		 * 
		 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
		 * Attribute is "unset", and it shouldn't take an actual default value).
		 * 
		 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
		 * cannot be "easily" parsed into a valid representation of its primitive type, `null` will be used 
		 * instead of converting to the primitive type's default.
		 */
		useNull : false
		
	} );
	
	return PrimitiveAttribute;
	
} );
/*global define */
/*jshint eqnull:true */
define('data/attribute/Boolean', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Primitive'
], function( _, Class, Attribute, PrimitiveAttribute ) {
	
	/**
	 * @class data.attribute.Boolean
	 * @extends data.attribute.Primitive
	 * 
	 * Attribute definition class for an Attribute that takes a boolean (i.e. true/false) data value.
	 */
	var BooleanAttribute = Class.extend( PrimitiveAttribute, {
		
		/**
		 * @cfg {Mixed/Function} defaultValue
		 * @inheritdoc
		 * 
		 * The Boolean Attribute defaults to `false`, unless the {@link #useNull} config is set to `true`, 
		 * in which case it defaults to `null` (to denote the Attribute being "unset").
		 */
		defaultValue: function() {
			return this.useNull ? null : false;
		},
		
		
		/**
		 * @cfg {Boolean} useNull
		 * 
		 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
		 * Attribute is "unset", and it shouldn't take an actual default value).
		 * 
		 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
		 * cannot be "easily" parsed into a Boolean (i.e. if it's undefined, null, or an empty string), 
		 * `null` will be used instead of converting to `false`.
		 */
		
		
		/**
		 * Override of superclass method, which converts the provided data value into a Boolean. If {@link #useNull} is true, 
		 * "unparsable" values will return `null`. See {@link #useNull} for details.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {Boolean} The converted value.
		 */
		convert : function( value ) {
			value = this._super( arguments );
			
			if( this.useNull && ( value == null || value === '' ) ) {
				return null;
			}
			return value === true || value === 'true' || value === 1 || value === "1";
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'boolean', BooleanAttribute );
	Attribute.registerType( 'bool', BooleanAttribute );
	
	return BooleanAttribute;
	
} );
/*global define */
define('data/attribute/Date', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Object'
], function( _, Class, Attribute, ObjectAttribute ) {
	
	/**
	 * @class data.attribute.Date
	 * @extends data.attribute.Object
	 * 
	 * Attribute definition class for an Attribute that takes a JavaScript Date object.
	 */
	var DateAttribute = Class.extend( ObjectAttribute, {
		
		/**
		 * Override of superclass method used to convert the provided data value into a JavaScript Date object. If the value provided 
		 * is not a Date, or cannot be parsed into a Date, will return `null`.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {Date} The Date object, or `null` if the value could not be parsed into a Date.
		 */
		convert : function( value ) {
			if( _.isDate( value ) ) {
				return value;
			}
			if( _.isNumber( value ) || ( _.isString( value ) && value && !isNaN( +value ) ) ) {
				return new Date( +value );  // If the date is a number (or a number in a string), assume it's the number of milliseconds since the Unix epoch (1/1/1970)
			}
			
			// All else fails, try to parse the value using Date.parse
			var parsed = Date.parse( value );
			return ( parsed ) ? new Date( parsed ) : null;
		}
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'date', DateAttribute );
	
	return DateAttribute;
	
} );
/*global define */
define('data/attribute/Number', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Primitive'
], function( _, Class, Attribute, PrimitiveAttribute ) {
	
	/**
	 * @abstract
	 * @class data.attribute.Number
	 * @extends data.attribute.Primitive
	 * 
	 * Abstract base class for an Attribute that takes a number data value.
	 */
	var NumberAttribute = PrimitiveAttribute.extend( {
		abstractClass: true,
		
		/**
		 * @cfg {Mixed/Function} defaultValue
		 * @inheritdoc
		 * 
		 * The Number Attribute defaults to 0, unless the {@link #useNull} config is 
		 * set to `true`, in which case it defaults to `null`.
		 */
		defaultValue: function() {
			return this.useNull ? null : 0;
		},
		
		
		/**
		 * @cfg {Boolean} useNull
		 * 
		 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
		 * Attribute is "unset", and it shouldn't take an actual default value).
		 * 
		 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
		 * cannot be parsed into an integer (i.e. if it's undefined, null, empty string, string with alpha characters in it,
		 * or other data type), `null` will be used instead of converting to 0.
		 */
		
		
		/**
		 * @protected
		 * @property {RegExp} stripCharsRegex 
		 * 
		 * A regular expression for stripping non-numeric characters from a numeric value. Defaults to `/[\$,%]/g`.
		 * This should be overridden for localization. A way to do this globally is, for example:
		 * 
		 *     require( [ 'data/attribute/Number' ], function( NumberAttribute ) {
		 *         NumberAttribute.prototype.stripCharsRegex = /newRegexHere/g;
		 *     } );
		 */
		stripCharsRegex : /[\$,%]/g,
		

		/**
		 * Override of superclass method used to convert the provided data value into a number. If {@link #useNull} is true, 
		 * undefined/null/empty string/unparsable values will return `null`, or else will otherwise be converted to 0.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {Number} The converted value.
		 */
		convert : function( value ) {
			value = this._super( arguments );
			value = this.parseNumber( String( value ).replace( this.stripCharsRegex, '' ) );

			return ( isNaN( value ) ) ? this.getDefaultValue() : value;
		},
		
		
		/**
		 * Abstract method which should implement the parsing function for the number (ex: `parseInt()` or `parseFloat()`).
		 * 
		 * @protected
		 * @abstract
		 * @method parseNumber
		 * @param {String} input The input value, as a string.
		 * @return {Number} The parsed number, or NaN if the input string was unparsable.
		 */
		parseNumber : Class.abstractMethod
		
	} );
	
	return NumberAttribute;
	
} );
/*global define */
define('data/attribute/Float', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Number'
], function( _, Class, Attribute, NumberAttribute ) {
	
	/**
	 * @class data.attribute.Float
	 * @extends data.attribute.Number
	 * 
	 * Attribute definition class for an Attribute that takes a float (i.e. decimal, or "real") number data value.
	 */
	var FloatAttribute = Class.extend( NumberAttribute, {
		
		/**
		 * Implementation of abstract superclass method, which parses the number as a float.
		 * 
		 * @protected
		 * @param {String} input The input value to convert.
		 * @return {Number} The converted value as a float, or NaN if the value was unparsable.
		 */
		parseNumber : function( value ) {
			return parseFloat( value, 10 );
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'float', FloatAttribute );
	Attribute.registerType( 'number', FloatAttribute );
	
	return FloatAttribute;
	
} );
/*global define */
define('data/attribute/Integer', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Number'
], function( _, Class, Attribute, NumberAttribute ) {
	
	/**
	 * @class data.attribute.Integer
	 * @extends data.attribute.Number
	 * 
	 * Attribute definition class for an Attribute that takes an integer data value. If a decimal
	 * number is provided (i.e. a "float"), the decimal will be ignored, and only the integer value used.
	 */
	var IntegerAttribute = Class.extend( NumberAttribute, {
		
		/**
		 * Implementation of abstract superclass method, which parses the number as an integer.
		 * 
		 * @protected
		 * @param {String} input The input value to convert.
		 * @return {Number} The converted value as an integer, or NaN if the value was unparsable.
		 */
		parseNumber : function( value ) {
			return parseInt( value, 10 );
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'int', IntegerAttribute );
	Attribute.registerType( 'integer', IntegerAttribute );
	
	return IntegerAttribute;
	
} );
/*global define */
define('data/attribute/Mixed', [
	'lodash',
	'Class',
	'data/attribute/Attribute'
], function( _, Class, Attribute ) {
	
	/**
	 * @class data.attribute.Mixed
	 * @extends data.attribute.Attribute
	 * 
	 * Attribute definition class for an Attribute that takes any data value.
	 */
	var MixedAttribute = Class.extend( Attribute, {
			
		// No specific implementation at this time. All handled by the base class Attribute.
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'mixed', MixedAttribute );
	
	return MixedAttribute;
	
} );
/*global define */
/*jshint eqnull:true */
define('data/attribute/String', [
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/Primitive'
], function( _, Class, Attribute, PrimitiveAttribute ) {
	
	/**
	 * @class data.attribute.String
	 * @extends data.attribute.Primitive
	 * 
	 * Attribute definition class for an Attribute that takes a string data value.
	 */
	var StringAttribute = Class.extend( PrimitiveAttribute, {
		
		/**
		 * @cfg {Mixed/Function} defaultValue
		 * @inheritdoc
		 * 
		 * The String Attribute defaults to `""` (empty string), unless the {@link #useNull} config is 
		 * set to `true`, in which case it defaults to `null` (to denote the Attribute being "unset").
		 */
		defaultValue: function() {
			return this.useNull ? null : "";
		},
		
		
		/**
		 * @cfg {Boolean} useNull
		 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
		 * Attribute is "unset", and it shouldn't take an actual default value).
		 * 
		 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
		 * cannot be "easily" parsed into a String (i.e. if it's undefined, or null), `null` will be used 
		 * instead of converting to an empty string.
		 */
		
		
		/**
		 * Override of superclass method used to convert the value into a string. If {@link #useNull} is true, "unparsable" values
		 * will return null. See {@link #useNull} for details.
		 * 
		 * @param {Mixed} value The value to convert.
		 * @return {String}
		 */
		convert : function( value ) {
			value = this._super( arguments );
			
			var defaultValue = ( this.useNull ) ? null : "";
			return ( value == null ) ? defaultValue : String( value );
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'string', StringAttribute );
	
	return StringAttribute;
	
} );
/*global define */
/*jshint forin:true, eqnull:true */
define('data/Model', [
	'require',
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/DataComponent',
	
	'data/persistence/proxy/Proxy',
	'data/persistence/operation/Read',
	'data/persistence/operation/Write',
	
	'data/attribute/Attribute',
	'data/attribute/DataComponent',
	'data/attribute/Collection',
	'data/attribute/Model',
	
	// All attribute types included so developers don't have to specify these when they declare attributes in their models.
	// These are not included in the arguments list though, as they are not needed specifically by the Model implementation.
	'data/attribute/Boolean',
	'data/attribute/Date',
	'data/attribute/Float',
	'data/attribute/Integer',
	'data/attribute/Mixed',
	'data/attribute/Model',
	'data/attribute/Number',
	'data/attribute/Object',
	'data/attribute/Primitive',
	'data/attribute/String',

	'data/NativeObjectConverter' // circular dependency, not included in args list
], function( 
	require,
	jQuery,
	_,
	Class,
	Data,
	DataComponent,
	
	Proxy,
	ReadOperation,
	WriteOperation,
	
	Attribute,
	DataComponentAttribute,
	CollectionAttribute,
	ModelAttribute
) {
	
	/**
	 * @class data.Model
	 * @extends data.DataComponent
	 * 
	 * Generalized key/value data storage class, which has a number of data-related features, including the ability to persist its data to a backend server.
	 * Basically, a Model represents some object of data that your application uses. For example, in an online store, one might define two Models: 
	 * one for Users, and the other for Products. These would be `User` and `Product` models, respectively. Each of these Models would in turn,
	 * have the {@link data.attribute.Attribute Attributes} (data values) that each Model is made up of. Ex: A User model may have: `userId`, `firstName`, and 
	 * `lastName` Attributes.
	 */
	var Model = Class.extend( DataComponent, {
		
		inheritedStatics : {
			/**
			 * A static property that is unique to each data.Model subclass, which uniquely identifies the subclass.
			 * @private
			 * @inheritable
			 * @static
			 * @property {String} __Data_modelTypeId
			 */
			
			
			// Subclass-specific setup
			/**
			 * @ignore
			 */
			onClassExtended : function( newModelClass ) {
				// Assign a unique id to this class, which is used in maps that hold the class
				newModelClass.__Data_modelTypeId = _.uniqueId();
				
				
				// Now handle initializing the Attributes, merging this subclass's attributes with the superclass's attributes
				var classPrototype = newModelClass.prototype,
				    superclassPrototype = newModelClass.superclass,
				    superclassAttributes = superclassPrototype.attributes || {},    // will be an Object (map) of attributeName -> Attribute instances
				    newAttributes = {},
				    attributeDefs = [],  // will be an array of Attribute configs (definitions) on the new subclass 
				    attributeObj,   // for holding each of the attributeDefs, one at a time
				    i, len;
				
				// Grab the 'attributes' property from the new subclass's prototype. If this is not present,
				// will use the empty array instead.
				if( classPrototype.hasOwnProperty( 'attributes' ) ) {
					attributeDefs = classPrototype.attributes;
				}
				
				// Instantiate each of the new subclass's Attributes, and then merge them with the superclass's attributes
				for( i = 0, len = attributeDefs.length; i < len; i++ ) {
					attributeObj = attributeDefs[ i ];
					
					// Normalize to a data.attribute.Attribute configuration object if it is a string
					if( typeof attributeObj === 'string' ) {
						attributeObj = { name: attributeObj };
					}
					
					// Create the actual Attribute instance
					var attribute = Attribute.create( attributeObj );
					newAttributes[ attribute.getName() ] = attribute;
				}
				
				newModelClass.prototype.attributes = _.defaults( _.clone( newAttributes ), superclassAttributes );  // newAttributes take precedence; superclassAttributes are used in the case that a newAttribute doesn't exist for a given attributeName
			},
			
			
			/**
			 * Retrieves the Attribute objects that are present for the Model, in an Object (map) where the keys
			 * are the Attribute names, and the values are the {@link data.attribute.Attribute} objects themselves.
			 * 
			 * @inheritable
			 * @static
			 * @return {Object} An Object (map) where the keys are the attribute {@link data.attribute.Attribute#name names},
			 *   and the values are the {@link data.attribute.Attribute Attribute} instances themselves.
			 */
			getAttributes : function() {
				// Note: `this` refers to the class (constructor function) that the static method was called on
				return this.prototype.attributes;
			},
			
			
			/**
			 * Retrieves the {@link data.persistence.proxy.Proxy} that is configured for the Model class. To retrieve
			 * a proxy that may belong to a particular model, use the instance level {@link #method-getProxy}.
			 * 
			 * @inheritable
			 * @static
			 * @return {data.persistence.proxy.Proxy} The Proxy configured with the Model, or null.
			 */
			getProxy : function() {
				return this.prototype.proxy || null;
			}
			
		},
		
		
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the Model's data to/from persistent
		 * storage. If this is not specified, the Model may not {@link #method-load} or {@link #method-save} its data.
		 * 
		 * Note that this may be specified as part of a Model subclass (so that all instances of the Model inherit
		 * the proxy), or on a particular model instance using {@link #setProxy}.
		 */
		
		/**
		 * @cfg {String[]/Object[]} attributes
		 * 
		 * Array of {@link data.attribute.Attribute Attribute} declarations. These are objects with any number of properties, but they
		 * must have the property 'name'. See the configuration options of {@link data.attribute.Attribute} for more information. 
		 * 
		 * Anonymous config objects defined here will become instantiated {@link data.attribute.Attribute} objects. An item in the array may also simply 
		 * be a string, which will specify the name of the {@link data.attribute.Attribute Attribute}, with no other {@link data.attribute.Attribute Attribute} 
		 * configuration options.
		 * 
		 * Attributes defined on the prototype of a Model, and its superclasses, are combined to become a single set of attributes come
		 * instantiation time. This means that the data.Model base class can define the 'id' attribute, and then subclasses
		 * can define their own attributes to append to it. So if a subclass defined the attributes `[ 'name', 'phone' ]`, then the
		 * final concatenated array of attributes for the subclass would be `[ 'id', 'name', 'phone' ]`. This works for however many
		 * levels of subclasses there are.
		 * 
		 * Example:
		 * 
		 *     attributes : [
		 *         'id',    // name-only; no other configs for this attribute (not recommended! should declare the {@link data.attribute.Attribute#type type})
		 *         { name: 'firstName', type: 'string' },
		 *         { name: 'lastName',  type: 'string' },
		 *         {
		 *             name : 'fullName',
		 *             get  : function( value ) {  // // in this example, the Attribute has no value of its own, so we ignore the arg
		 *                 return this.get( 'firstName' ) + ' ' + this.get( 'lastName' );  // `this` refers to the model that owns the Attribute
		 *             }
		 *         }
		 *     ]
		 * 
		 */
		
		/**
		 * @cfg {String} idAttribute
		 * The attribute that should be used as the ID for the Model. 
		 */
		idAttribute : 'id',
		
		/**
		 * @cfg {Boolean} ignoreUnknownAttrs
		 * 
		 * Set this to `true` to have the Model ignore unknown attributes when they are {@link #set} to the model. When this is `false` (the
		 * default), an error is thrown when an attribute is set to the model that doesn't have a corresponding {@link #cfg-attributes attribute} 
		 * definition. This helps to catch errors for incorrectly spelled attribute names, instead of simply allowing the code to continue along
		 * unknowingly. Problems and bugs caused by un-set data may then be difficult to track down to the original source of the problem, 
		 * especially in larger software systems. Therefore, it is **not recommended** that you set this configuration option.
		 * 
		 * However, it is possible that your original data source provides many data properties that you do not want to have corresponding 
		 * {@link #cfg-attributes attribute} definitions for. It is also possible that your data source adds properties from time to time, where you
		 * don't want your code throwing errors in production. In these cases, it may be useful to set this configuration option. Just note that 
		 * you will be bypassing the check which can help you determine the source of a possible error immediately, rather than further down the 
		 * line in the code's execution.
		 * 
		 * A possible option to get the best of both worlds is to leave this as the default (`false`) for "development" mode, and then set it to
		 * `true` on a global level for "production" mode. You can overwrite the default value of this configuration in production mode using a 
		 * snippet such at this:
		 * 
		 *     require( [
		 *         'data/Model'
		 *     ], function( Model ) {
		 *         
		 *         // Ignore unknown attributes if they come up from a data 
		 *         // source when in "production" mode
		 *         Model.prototype.ignoreUnknownAttrs = true;
		 *         
		 *     } );
		 * 
		 * Attributes retrieved with {@link #get} or {@link #raw} will still throw an error if the attribute name requested is unknown.
		 */
		ignoreUnknownAttrs : false,
		
		
		/**
		 * @private
		 * @property {Object} attributes
		 * 
		 * A hash of the combined Attributes, which have been put together from the current Model subclass, and all of
		 * its superclasses.
		 */
		
		/**
		 * @private
		 * @property {Object} data
		 * 
		 * A hash that holds the current data for the {@link data.attribute.Attribute Attributes}. The property names in this object match 
		 * the attribute names.  This hash holds the current data as it is modified by {@link #set}.
		 */
		
		/**
		 * @private 
		 * @property {Object} modifiedData
		 * A hash that serves two functions:
		 * 
		 * 1) Properties are set to it when an attribute is modified. The property name is the attribute {@link data.attribute.Attribute#name}. 
		 *    This allows it to be used to determine which attributes have been modified. 
		 * 2) The *original* (non-committed) data of the attribute (before it was {@link #set}) is stored as the value of the 
		 *    property. When rolling back changes (via {@link #method-rollback}), these values are copied back onto the {@link #data} object
		 *    to overwrite the data to be rolled back.
		 * 
		 * Went back and forth with naming this `originalData` and `modifiedData`, because it stores original data, but is used
		 * to determine which data is modified... 
		 */
		
		/**
		 * @private
		 * @property {Number} setCallCount
		 * 
		 * This variable supports the {@link #changeset} event, by keeping track of the number of calls to {@link #method-set}.
		 * When {@link #method-set} is called, this variable is incremented by 1. Just before {@link #method-set} returns, this variable is decremented
		 * by 1. If at the end of the {@link #method-set} method this variable reaches 0 again, the {@link #changeset} event is fired
		 * with all of the attribute changes since the first call to {@link #method-set}. This handles the recursive nature of the {@link #method-set} method,
		 * and the fact that {@link #method-set} may be called by Attribute {@link data.attribute.Attribute#cfg-set set} functions, and handlers of the
		 * {@link #change} event.
		 */
		setCallCount : 0,
		
		/**
		 * @private
		 * @property {Object} changeSetNewValues
		 * 
		 * An Object (map) which holds the changes to attributes for the {@link #changeset} event to fire with. This map collects the 
		 * changed values as calls to {@link #method-set} are made, and is used with the arguments that the {@link #changeset} event fires
		 * with (when it does fire, at the end of all of the calls to {@link #method-set}).
		 */
		
		/**
		 * @private
		 * @property {Object} changeSetOldValues
		 * 
		 * A map which holds the changes to attributes for the {@link #changeset} event to fire with. This map collects the 
		 * previous ("old") values as calls to {@link #method-set} are made, and is used with the arguments that the {@link #changeset} event fires
		 * with (when it does fire, at the end of all of the calls to {@link #method-set}).
		 */
		
		/**
		 * @private
		 * @property {String} id (readonly)
		 * The id for the Model. This property is set when the attribute specified by the {@link #idAttribute} config
		 * is {@link #set}. 
		 * 
		 * *** Note: This property is here solely to maintain compatibility with Backbone's Collection, and should
		 * not be accessed or used, as it will most likely be removed in the future.
		 */
		
		/**
		 * @protected
		 * @property {Boolean} loading
		 * 
		 * Flag that is set to `true` while the Model is loading.
		 */
		loading : false,
		
		/**
		 * @protected
		 * @property {Boolean} saving
		 * 
		 * Flag that is set to `true` while the Model is saving.
		 */
		saving : false,
		
		/**
		 * @protected
		 * @property {Boolean} destroying
		 * 
		 * Flag that is set to `true` while the Model is destroying.
		 */
		destroying : false,
		
		/**
		 * @protected
		 * @property {Boolean} destroyed
		 * 
		 * Flag that is set to true once the Model has been successfully destroyed.
		 */
		destroyed : false,
		
		
		
		/**
		 * Creates a new Model instance.
		 * 
		 * @constructor 
		 * @param {Object} [data] Any initial data for the {@link #cfg-attributes attributes}, specified in an object (hash map). See {@link #set}.
		 */
		constructor : function( data ) {
			// Default the data to an empty object
			data = data || {};
			
			// Call superclass constructor
			this._super( arguments );
			
			// If this class has a proxy definition that is an object literal, instantiate it *onto the prototype*
			// (so one Proxy instance can be shared for every model)
			if( this.proxy && typeof this.proxy === 'object' && !( this.proxy instanceof Proxy ) ) {
				this.constructor.prototype.proxy = Proxy.create( this.proxy );
			}
			
			
			this.addEvents(				
				/**
				 * Fires when a {@link data.attribute.Attribute} in the Model has changed its value.
				 * 
				 * This event has two forms:
				 * 
				 * 1. The form documented as this event, where the `attributeName` is provided, and
				 * 2. The form where a particular attribute name may be listened to directly. In this second form,
				 *    one may subscribe to the event by adding a colon and then the attribute name to the event name. 
				 *    For example, if you want to just respond to `title` attribute changes on a model, you could subscribe
				 *    to the `change:title` event. Ex:
				 *    
				 *        model.on( 'change:title', function( model, newValue, oldValue ) { ... } );
				 *        
				 *    In this second form, the `attributeName` argument is *not* provided, as you are only listening for 
				 *    changes on one particular attribute.
				 * 
				 * @event change
				 * @param {data.Model} model This Model instance.
				 * @param {String} attributeName The name of the attribute that was changed.
				 * @param {Mixed} newValue The new value, processed by the attribute's {@link data.attribute.Attribute#get get} function if one exists. 
				 * @param {Mixed} oldValue The old (previous) value, processed by the attribute's {@link data.attribute.Attribute#get get} function if one exists. 
				 */
				'change',
				
				/**
				 * Fires once at the end of one of more (i.e. a set) of Attribute changes to the model. Multiple changes may be made to the model in a "set" by
				 * providing the first argument to {@link #method-set} as an object, and/or may also result from having {@link data.attribute.Attribute#cfg-set Attribute set} 
				 * functions which modify other Attributes. Or, one final way that changes may be counted in a "set" is if handlers of the {@link #change} event end up
				 * setting Attributes on the Model as well.
				 * 
				 * Note: This event isn't quite production-ready, as it doesn't take into account changes from nested {@Link data.DataComponent DataComponents}
				 * ({@link data.Model Models} and {@link data.Collection Collections}), but can be used for a set of flat changes in the Model.
				 * 
				 * @event changeset
				 * @param {data.Model} model This Model instance.
				 * @param {Object} newValues An Object (map) of the new values of the Attributes that changed. The object's keys (property names) are the
				 *   {@link data.attribute.Attribute#name Attribute names}, and the object's values are the new values for those Attributes.
				 * @param {Object} oldValues An Object (map) of the old values of the Attributes that changed. The object's keys (property names) are the
				 *   {@link data.attribute.Attribute#name Attribute names}, and the object's values are the old values that were held for those Attributes.
				 */
				'changeset',
				
				/**
				 * Fires when the data in the model is {@link #method-commit committed}. This happens if the
				 * {@link #method-commit commit} method is called, and after a successful {@link #method-save}.
				 * 
				 * @event commit
				 * @param {data.Model} model This Model instance.
				 */
				'commit',
				
				/**
				 * Fires when the data in the model is {@link #method-rollback rolled back}. This happens when the
				 * {@link #method-rollback rollback} method is called.
				 * 
				 * @event rollback
				 * @param {data.Model} model This Model instance.
				 */
				'rollback',
				
				/**
				 * Fires when the Model begins a {@link #method-load} request, through its {@link #proxy}. The 
				 * {@link #event-load} event will fire when the load is complete.
				 * 
				 * @event loadbegin
				 * @param {data.Model} This Model instance.
				 */
				'loadbegin',
				
				/**
				 * Fires when the Model is {@link #method-load loaded} from its external data store (such as a web server), 
				 * through its {@link #proxy}.
				 * 
				 * This event fires for both successful and failed "load" requests. Success of the load request may 
				 * be determined using the `operation`'s {@link data.persistence.operation.Operation#wasSuccessful wasSuccessful} 
				 * method.
				 * 
				 * @event load
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Read} operation The ReadOperation object for the load request.
				 */
				'load',
				
				/**
				 * Fires when the Model begins a {@link #method-save} request, through its {@link #proxy}. The 
				 * {@link #event-save} event will fire when the save is complete.
				 * 
				 * @event savebegin
				 * @param {data.Model} This Model instance.
				 */
				'savebegin',
				
				/**
				 * Fires when the Model is {@link #method-save saved} to its external data store (such as a web server),
				 * through its {@link #proxy}.
				 * 
				 * This event fires for both successful and failed "save" requests. Success of the save request may 
				 * be determined using the `operation`'s {@link data.persistence.operation.Operation#wasSuccessful wasSuccessful} 
				 * method.
				 * 
				 * @event save
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Write} operation The WriteOperation object for the save request.
				 */
				'save',
				
				/**
				 * Fires when the Model begins a {@link #method-destroy} request, through its {@link #proxy}. The 
				 * {@link #event-destroy} event will fire when the destroy is complete.
				 * 
				 * @event destroybegin
				 * @param {data.Model} This Model instance.
				 */
				'destroybegin',
				
				/**
				 * Fires when the Model has been {@link #method-destroy destroyed} on its external data store (such as a 
				 * web server), through its {@link #proxy}.
				 * 
				 * @event destroy
				 * @param {data.Model} model This Model instance.
				 * @param {data.persistence.operation.Write} operation The WriteOperation object for the destroy request.
				 */
				'destroy'
			);
			
			
			// Set the default values for attributes that don't have an initial value.
			var attributes = this.attributes,  // this.attributes is a hash of the Attribute objects, keyed by their name
			    attributeDefaultValue;
			for( var name in attributes ) {
				if( data[ name ] === undefined && ( attributeDefaultValue = attributes[ name ].getDefaultValue() ) !== undefined ) {
					data[ name ] = attributeDefaultValue;
				}
			}
			
			// Initialize the underlying data object, which stores all attribute values
			this.data = {};
			
			// Initialize the data hash for storing attribute names of modified data, and their original values (see property description)
			this.modifiedData = {};
			
			// Set the initial data / defaults, if we have any
			this.set( data );
			this.commit();  // and because we are initializing, the data is not considered modified
			
			// Call hook method for subclasses
			this.initialize();
		},
		
		
		/**
		 * Hook method for subclasses to initialize themselves. This method should be overridden in subclasses to 
		 * provide any model-specific initialization.
		 * 
		 * Note that it is good practice to always call the superclass `initialize` method from within yours (even if
		 * your class simply extends data.Model, which has no `initialize` implementation itself). This is to future proof it
		 * from being moved under another superclass, or if there is ever an implementation made in this class.
		 * 
		 * Ex:
		 * 
		 *     MyModel = Model.extend( {
		 *         initialize : function() {
		 *             MyModel.superclass.initialize.apply( this, arguments );   // or could be MyModel.__super__.initialize.apply( this, arguments );
		 *             
		 *             // my initialization logic goes here
		 *         }
		 *     }
		 * 
		 * @protected
		 * @method initialize
		 */
		initialize : Data.emptyFn,
		
		
		/**
		 * Retrieves the Attribute objects that are present for the Model, in an Object (map) where the keys
		 * are the Attribute names, and the values are the {@link data.attribute.Attribute} objects themselves.
		 * 
		 * @return {Object} An Object (map) where the keys are the attribute {@link data.attribute.Attribute#name names},
		 *   and the values are the {@link data.attribute.Attribute Attribute} instances themselves.
		 */
		getAttributes : function() {
			return this.attributes;
		},
		
		
		// --------------------------------
		
		
		/**
		 * Retrieves the ID for the Model. This uses the configured {@link #idAttribute} to retrieve
		 * the correct ID attribute for the Model.
		 * 
		 * @return {Mixed} The ID for the Model.
		 */
		getId : function() {
			// Provide a friendlier error message than what get() provides if the idAttribute is not an Attribute of the Model
			if( !( this.idAttribute in this.attributes ) ) {
				throw new Error( "Error: The `idAttribute` (currently set to an attribute named '" + this.idAttribute + "') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it." );
			}
			return this.get( this.idAttribute );
		},
		
		
		/**
		 * Retrieves the "ID attribute" for the Model, if there is a valid id attribute. The Model has a valid ID attribute if there exists
		 * an attribute which is referenced by the {@link #idAttribute} config. Otherwise, returns null.
		 * 
		 * @return {data.attribute.Attribute} The Attribute that represents the ID attribute, or null if there is no valid ID attribute.
		 */
		getIdAttribute : function() {
			return this.attributes[ this.idAttribute ] || null;
		},
		
		
		/**
		 * Retrieves the name of the "ID attribute" for the Model. This will be the attribute referenced by the {@link #idAttribute}
		 * config.
		 * 
		 * @return {String} The name of the "ID attribute".
		 */
		getIdAttributeName : function() {
			return this.idAttribute;
		},
		
		
		/**
		 * Determines if the Model has a valid {@link #idAttribute}. Will return true if there is an {@link #cfg-attributes attribute}
		 * that is referenced by the {@link #idAttribute}, or false otherwise.
		 * 
		 * @return {Boolean}
		 */
		hasIdAttribute : function() {
			return !!this.attributes[ this.idAttribute ];
		},
	
		
		// --------------------------------
		
		
		/**
		 * Sets the value for a {@link data.attribute.Attribute Attribute} given its `name`, and a `value`. For example, a call could be made as this:
		 * 
		 *     model.set( 'attribute1', 'value1' );
		 * 
		 * As an alternative form, multiple valuse can be set at once by passing an Object into the first argument of this method. Ex:
		 * 
		 *     model.set( { key1: 'value1', key2: 'value2' } );
		 * 
		 * Note that in this form, the method will ignore any property in the object (hash) that don't have associated Attributes.
		 * 
		 * When attributes are set, their {@link data.attribute.Attribute#cfg-set} method is run, if they have one defined.
		 * 
		 * @param {String/Object} attributeName The attribute name for the Attribute to set, or an object (hash) of name/value pairs.
		 * @param {Mixed} [newValue] The value to set to the attribute. Required if the `attributeName` argument is a string (i.e. not a hash).
		 * @param {Object} [options] Any options to pass to the method. This should be the second argument if providing an Object to the 
		 *   first parameter. This should be an object which may contain the following properties:
		 * @param {Boolean} [options.ignoreUnknownAttrs] Set to `true` if unknown attributes should be ignored in the data object provided
		 *   to the first argument of this method. This is useful if you have an object which contains many properties, but your model does not
		 *   define matching attributes for each one of them. This option is **not recommended**, as it bypasses the check which can help you 
		 *   determine that you have possibly typed an attribute name incorrectly, and it may then be difficult at the time when a bug arises 
		 *   because of it (especially in a large software system) to determine where the source of the problem was. Defaults to the value of the 
		 *   {@link #ignoreUnknownAttrs} config.
		 */
		set : function( attributeName, newValue, options ) {
			// If coming into the set() method for the first time (non-recursively, not from an attribute setter, not from a 'change' handler, etc),
			// reset the maps which will hold the newValues and oldValues that will be provided to the 'changeset' event. These will be used by the
			// `doSet()` method.
			if( this.setCallCount === 0 ) {
				this.changeSetNewValues = {};
				this.changeSetOldValues = {};
			}
			
			// Increment the setCallCount, for use with the 'changeset' event. The 'changeset' event only fires when all calls to set() have exited.
			this.setCallCount++;
			
			var changeSetNewValues = this.changeSetNewValues,
			    changeSetOldValues = this.changeSetOldValues;
			
			if( typeof attributeName === 'string' ) {
				options = options || {};
				this.doSet( attributeName, newValue, options, changeSetNewValues, changeSetOldValues );
				
			} else {  // Object (map) provided as first arg
				options = newValue || {};    // 2nd arg is the `options` object with this form
				var values = attributeName,  // for clarity
				    attributes = this.attributes,
				    attrsWithSetters = [],
				    ignoreUnknownAttrs = ( options.ignoreUnknownAttrs === undefined ) ? this.ignoreUnknownAttrs : options.ignoreUnknownAttrs;
				
				for( attributeName in values ) {
					if( values.hasOwnProperty( attributeName ) ) {
						var attribute = attributes[ attributeName ];
						
						if( !attribute ) {  // no matching attribute for the current attributeName (property name) in the data object
							if( ignoreUnknownAttrs )
								continue;
							
							// <debug>
							throw new Error( "data.Model.set(): An attribute with the attributeName '" + attributeName + "' was not found." );
							// </debug>
						}
						
						if( attribute.hasUserDefinedSetter() ) {   // defer setting the values on attributes with user-defined setters until all attributes without user-defined setters have been set
							attrsWithSetters.push( attributeName );
						} else {
							this.doSet( attributeName, values[ attributeName ], options, changeSetNewValues, changeSetOldValues );
						}
					}
				}
				
				for( var i = 0, len = attrsWithSetters.length; i < len; i++ ) {
					attributeName = attrsWithSetters[ i ];
					this.doSet( attributeName, values[ attributeName ], options, changeSetNewValues, changeSetOldValues );
				}
			}
			
			// Handle firing the 'changeset' event, which fires once for all of the attribute changes to the Model (i.e. when all calls to set() have exited)
			this.setCallCount--;
			if( this.setCallCount === 0 ) {
				this.fireEvent( 'changeset', this, changeSetNewValues, changeSetOldValues );
			}
		},
		
		
		/**
		 * Called internally by the {@link #set} method, this method performs the actual setting of an attribute's value.
		 * 
		 * @protected
		 * @param {String} attributeName The attribute name for the Attribute to set.
		 * @param {Mixed} newValue The value to set to the attribute.
		 * @param {Object} options The `options` object provided to {@link #set}. See {@link #set} for details.
		 * @param {Object} changeSetNewValues A reference to the collector map which holds the current changeset's new values. This is
		 *   an "output" parameter, and is modified by this method by storing the new value for a given attribute name.
		 * @param {Object} changeSetOldValues A reference to the collector map which holds the current changeset's old values. This is
		 *   an "output" parameter, and is modified by this method by storing the old value for a given attribute name.
		 */
		doSet : function( attributeName, newValue, options, changeSetNewValues, changeSetOldValues ) {
			var attribute = this.attributes[ attributeName ],
			    modelData = this.data,
			    modelModifiedData = this.modifiedData,
			    ignoreUnknownAttrs = ( options.ignoreUnknownAttrs === undefined ) ? this.ignoreUnknownAttrs : options.ignoreUnknownAttrs;
			
			if( !attribute ) {
				if( ignoreUnknownAttrs ) return;  // simply return; nothing to do
				
				// <debug>
				throw new Error( "data.Model.set(): An attribute with the attributeName '" + attributeName + "' was not found." );
				// </debug>
			}
			
			// Get the current (old) value of the attribute, and its current "getter" value (to provide to the 'change' event as the oldValue)
			var oldValue = modelData[ attributeName ],
			    oldGetterValue = this.get( attributeName );
			
			// Call the Attribute's set() method (or user-provided 'set' config function) to do any implemented conversion
			newValue = attribute.set( this, newValue, oldValue );
			
			// ----------------------------------------------------------------------------------------------------------------------------
			// *** Temporary workaround to get the 'change' event to fire on an Attribute whose set() config function does not
			// return a new value to set to the underlying data. This will be resolved once dependencies are 
			// automatically resolved in the Attribute's get() function.
			if( attribute.hasUserDefinedSetter() && newValue === undefined ) {  // the attribute will only have a 'set' property of its own if the 'set' config was provided
				// This is to make the following block below think that there is already data in for the attribute, and
				// that it has the same value. If we don't have this, the change event will fire twice, the
				// the model will be considered modified, and the old value will be put into the `modifiedData` hash.
				if( !modelData.hasOwnProperty( attributeName ) ) {
					modelData[ attributeName ] = undefined;
				}
				
				// Fire the events with the value of the Attribute after it has been processed by any Attribute-specific `get()` function.
				newValue = this.get( attributeName );
				
				// Store the 'change' in the 'changeset' maps
				changeSetNewValues[ attributeName ] = newValue;
				if( !changeSetOldValues.hasOwnProperty( attributeName ) ) {  // only store the "old" value if we don't have an "old" value for the attribute already. This leaves us with the real "old" value when multiple sets occur for an attribute during the changeset.
					changeSetOldValues[ attributeName ] = oldGetterValue;
				}
				
				// Now manually fire the events
				this.fireEvent( 'change:' + attributeName, this, newValue, oldGetterValue );  // model, newValue, oldValue
				this.fireEvent( 'change', this, attributeName, newValue, oldGetterValue );    // model, attributeName, newValue, oldValue
			}
			// ----------------------------------------------------------------------------------------------------------------------------
			
			// Allow the Attribute to post-process the newValue (the value returned from the Attribute's set() function)
			newValue = attribute.afterSet( this, newValue );
			
			// Only change the underlying data if there is no current value for the attribute, or if newValue is different from the current
			if( !modelData.hasOwnProperty( attributeName ) || !attribute.valuesAreEqual( oldValue, newValue ) ) {   // let the Attribute itself determine if two values of its datatype are equal
				// Store the attribute's *current* value (not the newValue) into the "modifiedData" attributes hash.
				// This should only happen the first time the attribute is set, so that the attribute can be rolled back even if there are multiple
				// set() calls to change it.
				if( !modelModifiedData.hasOwnProperty( attributeName ) ) {
					modelModifiedData[ attributeName ] = oldValue;
				}
				modelData[ attributeName ] = newValue;
				
				
				// Now that we have set the new raw value to the internal `data` hash, we want to fire the events with the value
				// of the Attribute after it has been processed by any Attribute-specific `get()` function.
				newValue = this.get( attributeName );
				
				// Store the 'change' values in the changeset maps, for use when the 'changeset' event fires (from set() method)
				changeSetNewValues[ attributeName ] = newValue;
				if( !changeSetOldValues.hasOwnProperty( attributeName ) ) {  // Only store the "old" value if we don't have an "old" value for the attribute already. This leaves us with the real "old" value when multiple set()'s occur for an attribute during the changeset.
					changeSetOldValues[ attributeName ] = oldGetterValue;
				}
				
				// And finally, fire the 'change' events
				this.fireEvent( 'change:' + attributeName, this, newValue, oldGetterValue );  // model, newValue, oldValue
				this.fireEvent( 'change', this, attributeName, newValue, oldGetterValue );    // model, attributeName, newValue, oldValue
			}
		},
		
		
		/**
		 * Retrieves the value for the attribute given by `attributeName`. If the {@link data.attribute.Attribute Attribute} has a
		 * {@link data.attribute.Attribute#get get} function defined, that function will be called, and its return value
		 * will be used as the return of this method.
		 * 
		 * @param {String} attributeName The name of the Attribute whose value to retieve.
		 * @return {Mixed} The value of the attribute returned by the Attribute's {@link data.attribute.Attribute#get get} function (if
		 * one exists), or the underlying value of the attribute. Will return undefined if there is no {@link data.attribute.Attribute#get get}
		 * function, and the value has never been set.  
		 */
		get : function( attributeName ) {
			// <debug>
			if( !( attributeName in this.attributes ) ) {
				throw new Error( "data.Model::get() error: attribute '" + attributeName + "' was not found on the Model." );
			}
			// </debug>
			
			var value = this.data[ attributeName ],
			    attribute = this.attributes[ attributeName ];
			
			// If there is a `get` function on the Attribute, run it now to convert the value before it is returned.
			if( typeof attribute.get === 'function' ) {
				value = attribute.get( this, value );  // provide the underlying value
			}
			
			return value;
		},
		
		
		/**
		 * Retrieves the *raw* value for the attribute given by `attributeName`. If the {@link data.attribute.Attribute Attributes} has a
		 * {@link data.attribute.Attribute#raw raw} function defined, that function will be called, and its return value will be used
		 * by the return of this method. If not, the underlying data that is currently stored will be returned, bypassing any
		 * {@link data.attribute.Attribute#get get} function defined on the {@link data.attribute.Attribute Attribute}.
		 * 
		 * @param {String} attributeName The name of the Attribute whose raw value to retieve.
		 * @return {Mixed} The value of the attribute returned by the Attribute's {@link data.attribute.Attribute#raw raw} function (if
		 * one exists), or the underlying value of the attribute. Will return undefined if there is no {@link data.attribute.Attribute#raw raw}
		 * function, and the value has never been set.
		 */
		raw : function( attributeName ) {
			// <debug>
			if( !this.attributes.hasOwnProperty( attributeName ) ) {
				throw new Error( "data.Model::raw() error: attribute '" + attributeName + "' was not found on the Model." );
			}
			// </debug>
			
			var value = this.data[ attributeName ],
			    attribute = this.attributes[ attributeName ];
			
			// If there is a `raw` function on the Attribute, run it now to convert the value before it is returned.
			if( typeof attribute.raw === 'function' ) {
				value = attribute.raw( this, value );  // provide the underlying value
			}
			
			return value;
		},
		
		
		/**
		 * Returns the default value specified for an Attribute.
		 * 
		 * @param {String} attributeName The attribute name to retrieve the default value for.
		 * @return {Mixed} The default value for the attribute.
		 */
		getDefault : function( attributeName ) {
			return this.attributes[ attributeName ].getDefaultValue();
		},
		
		
		/**
		 * Determines if the Model has a given attribute (attribute).
		 * 
		 * @param {String} attributeName The name of the attribute (attribute) name to test for.
		 * @return {Boolean} True if the Model has the given attribute name.
		 */
		has : function( attributeName ) {
			return !!this.attributes[ attributeName ];
		},	
		
		
		// --------------------------------
		
		
		/**
		 * Determines if the Model is a new model, and has not yet been persisted to the server.
		 * It is a new Model if it lacks an id.
		 * 
		 * @return {Boolean} True if the model is new, false otherwise.
		 */
		isNew : function() {
			if( !this.hasIdAttribute() ) {
				return true;
			} else {
				return !this.getId();  // Any falsy value makes the model be considered "new". This includes null, 0, and ""
			}
		},
		
		
		/**
		 * Determines if any attribute(s) in the model are modified, or if a given attribute has been modified, since the last 
		 * {@link #method-commit} or {@link #method-rollback}.
		 * 
		 * @override
		 * @param {String} [attributeName] Provide this argument to test if a particular attribute has been modified. If this is not 
		 *   provided, the model itself will be checked to see if there are any modified attributes. 
		 * 
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This may be provided as the first argument to the
		 *   method if no `attributeName` is to be provided. Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link data.attribute.Attribute#persist persisted} 
		 *   attribute is modified. 
		 * 
		 * @return {Boolean} True if the attribute has been modified, false otherwise.
		 */
		isModified : function( attributeName, options ) {
			if( typeof attributeName === 'object' ) {  // 'options' provided as first argument, fix the parameter variables
				options = attributeName;
				attributeName = undefined;
			}
			
			options = options || {};
			
			var attributes = this.attributes,
			    data = this.data,
			    modifiedData = this.modifiedData;
			
			if( !attributeName ) {
				// First, check if there are any modifications to primitives (i.e. non-nested Models/Collections).
				// If the 'persistedOnly' option is true, we only consider attributes that are persisted.
				for( var attr in modifiedData ) {
					if( modifiedData.hasOwnProperty( attr ) && ( !options.persistedOnly || ( options.persistedOnly && attributes[ attr ].isPersisted() ) ) ) {
						return true;  // there is any property in the modifiedData map, return true (unless 'persistedOnly' option is set, in which case we only consider persisted attributes)
					}
				}
				
				// No local modifications to primitives, check all embedded collections/models to see if they have changes
				var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
				    dataComponent;
				
				for( var i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
					var attrName = embeddedDataComponentAttrs[ i ].getName();
					
					if( ( dataComponent = data[ attrName ] ) && dataComponent.isModified( options ) ) {
						return true;
					}
				}
				return false;
				
			} else {
				// Handle an attributeName being provided to this method
				var attribute = attributes[ attributeName ];
				
				if( attribute instanceof DataComponentAttribute && attribute.isEmbedded() && data[ attributeName ].isModified( options ) ) {   // DataComponent (Model or Collection) attribute is modified
					return true;
				} else if( modifiedData.hasOwnProperty( attributeName ) && ( !options.persistedOnly || ( options.persistedOnly && attributes[ attributeName ].isPersisted() ) ) ) {  // primitive (non Model or Collection) attribute is modified
					return true;
				}
				
				return false;
			}
		},
		
		
		/**
		 * Retrieves the values for all of the attributes in the Model. The Model attributes are retrieved via the {@link #get} method,
		 * to pre-process the data before it is returned in the final hash, unless the `raw` option is set to true,
		 * in which case the Model attributes are retrieved via {@link #raw}. 
		 * 
		 * @override
		 * 
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link data.attribute.Attribute Attribute} values.
		 */
		getData : function( options ) {
			return require( 'data/NativeObjectConverter' ).convert( this, options );
		},
		
		
		/**
		 * Retrieves the values for all of the {@link data.attribute.Attribute attributes} in the Model whose values have been changed since
		 * the last {@link #method-commit} or {@link #method-rollback}. 
		 * 
		 * The Model attributes are retrieved via the {@link #get} method, to pre-process the data before it is returned in the final hash, 
		 * unless the `raw` option is set to true, in which case the Model attributes are retrieved via {@link #raw}.
		 * 
		 * 
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details. Options specific to this method include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return only changed attributes that are 
		 *   {@link data.attribute.Attribute#persist persisted}. In the case of nested models, a nested model will only be returned in the resulting
		 *   map if one if its {@link data.attribute.Attribute#persist persisted} attributes are modified. 
		 * 
		 * @return {Object} A hash of the attributes that have been changed since the last {@link #method-commit} or {@link #method-rollback}.
		 *   The hash's property names are the attribute names, and the hash's values are the new values.
		 */
		getChanges : function( options ) {
			options = options || {};
			
			// Provide specific attribute names to the NativeObjectConverter's convert() method, which are only the
			// names for attributes which hold native JS objects that have changed (not embedded models/arrays)
			options.attributeNames = _.keys( this.modifiedData );
			
			// Add any modified embedded model/collection to the options.attributeNames array
			var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
			    data = this.data,
			    dataComponent,
			    collection,
			    attrName,
			    i, len;
		
			for( i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
				attrName = embeddedDataComponentAttrs[ i ].getName();
				
				if( ( dataComponent = data[ attrName ] ) && dataComponent.isModified( options ) ) {
					options.attributeNames.push( attrName );
				}
			}
			
			// Add any shallow-modified 'related' (i.e. non-embedded) collections to the options.attributeNames array
			var relatedCollectionAttrs = this.getRelatedCollectionAttributes();
			for( i = 0, len = relatedCollectionAttrs.length; i < len; i++ ) {
				attrName = relatedCollectionAttrs[ i ].getName();
				
				if( ( collection = data[ attrName ] ) && collection.isModified( { shallow: true } ) ) {
					options.attributeNames.push( attrName );
				}
			}
			
			return require( 'data/NativeObjectConverter' ).convert( this, options );
		},
		
		
		/**
		 * Commits modified attributes' data. Data can no longer be reverted after a commit has been performed. Note: When developing with a {@link #proxy},
		 * this method should normally not need to be called explicitly, as it will be called upon the successful persistence of the Model's data
		 * to the server.
		 * 
		 * @override
		 */
		commit : function() {
			this.modifiedData = {};  // reset the modifiedData hash. There is no modified data.
			
			// Go through all embedded models/collections, and "commit" those as well
			var embeddedDataComponentAttrs = this.getEmbeddedDataComponentAttributes(),
			    data = this.data,
			    attrName,
			    dataComponent,
			    collection;
			
			for( var i = 0, len = embeddedDataComponentAttrs.length; i < len; i++ ) {
				attrName = embeddedDataComponentAttrs[ i ].getName();
				
				if( ( dataComponent = data[ attrName ] ) ) {
					dataComponent.commit();
				}
			}
			
			// Shallowly commit any 'related' (i.e. non-embedded) collections
			var relatedCollectionAttrs = this.getRelatedCollectionAttributes();
			for( i = 0, len = relatedCollectionAttrs.length; i < len; i++ ) {
				attrName = relatedCollectionAttrs[ i ].getName();
				
				if( ( collection = data[ attrName ] ) && collection.isModified( { shallow: true } ) ) {
					collection.commit( { shallow: true } );
				}
			}
			
			this.fireEvent( 'commit', this );
		},
		
		
		/**
		 * Rolls back the Model attributes that have been changed since the last commit or rollback.
		 * 
		 * @override
		 */
		rollback : function() {
			// Loop through the modifiedData hash, which holds the *original* values, and set them back to the data hash.
			var modifiedData = this.modifiedData;
			for( var attributeName in modifiedData ) {
				if( modifiedData.hasOwnProperty( attributeName ) ) {
					this.data[ attributeName ] = modifiedData[ attributeName ];
				}
			}
			
			this.modifiedData = {};
			
			this.fireEvent( 'rollback', this );
		},
		
		
		// --------------------------------
		
		
		/**
		 * Creates a clone of the Model, by copying its instance data. Note that the cloned model will *not* have a value
		 * for its {@link #idAttribute} (as it is a new model, and multiple models of the same type cannot exist with
		 * the same id). You may optionally provide a new id for the clone with the `id` parameter. 
		 * 
		 * Note: This is a very early, alpha version of the method, where the final version will most likely
		 * account for embedded models, while copying embedded models and other such nested data. Will also handle 
		 * circular dependencies. I don't recommend using it just yet.
		 * 
		 * @param {Mixed} [id] A new id for the Model. Defaults to undefined.
		 * @return {data.Model} The new Model instance, which is a clone of the Model this method was called on.
		 */
		clone : function( id ) {
			var data = _.cloneDeep( this.getData() );
			
			// Remove the id, so that it becomes a new model. If this is kept here, a reference to this exact
			// model will be returned instead of a new one, as the framework does not allow duplicate models with
			// the same id. Otherwise, if a new id is passed, it will be set to the new model.
			if( typeof id === 'undefined' ) {
				delete data[ this.idAttribute ];
			} else {
				data[ this.idAttribute ] = id;
			}
			
			return new this.constructor( data );
		},
		
		
		// --------------------------------
		
		// Persistence Functionality
		
			
		/**
		 * Sets the {@link data.persistence.proxy.Proxy} that for this particular model instance. Setting a proxy
		 * with this method will only affect this particular model instance, not any others.
		 * 
		 * To configure a proxy that will be used for all instances of the Model, set one in a Model sublass.
		 * 
		 * @param {data.persistence.proxy.Proxy} The Proxy to set to this model instance.
		 */
		setProxy : function( proxy ) {
			this.proxy = proxy;
		},
		
			
		/**
		 * Retrieves the {@link data.persistence.proxy.Proxy} that is configured for this model instance. To retrieve
		 * the proxy that belongs to the Model class itself, use the static {@link #static-method-getProxy getProxy} 
		 * method. Note that unless the model instance is configured with a different proxy, it will inherit the
		 * Model's static proxy.
		 * 
		 * @return {data.persistence.proxy.Proxy} The Proxy configured for the model, or null.
		 */
		getProxy : function() {
			return this.proxy || null;
		},
		
		
		/**
		 * Determines if the Model is currently {@link #loading}, via its {@link #proxy}.
		 * 
		 * @return {Boolean} `true` if the Model is currently loading a set of data, `false` otherwise.
		 */
		isLoading : function() {
			return this.loading;
		},
		
		
		/**
		 * Determines if the Model is currently {@link #method-save saving} its data, via its {@link #proxy}
		 * 
		 * @return {Boolean} `true` if the Model is currently saving its set of data, `false` otherwise.
		 */
		isSaving : function() {
			return this.saving;
		},
		
		
		/**
		 * Determines if the Model is currently {@link #method-destroy destroying} itself, via its {@link #proxy}.
		 * 
		 * @return {Boolean} `true` if the Model is currently saving its set of data, `false` otherwise.
		 */
		isDestroying : function() {
			return this.destroying;
		},
		
		
		/**
		 * Determines if the Model has been {@link #method-destroy destroyed}.
		 * 
		 * @return {Boolean} `true` if the Model has been destroyed, `false` otherwise.
		 */
		isDestroyed : function() {
			return this.destroyed;
		},
		
		
		/**
		 * (Re)Loads the Model's attributes from its persistent storage (such as a web server), using the configured 
		 * {@link #proxy}. Any changed data will be discarded. The Model must have a value for its {@link #idAttribute}
		 * for this method to succeed.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `model` : {@link data.Model} This Model instance.
		 * - `operation` : {@link data.persistence.operation.Read} The ReadOperation that was executed.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Function} [options.success] Function to call if the save is successful.
		 * @param {Function} [options.failure] Function to call if the save fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of a success or fail state.
		 * @param {Object} [options.scope] The object to call the `success`, `failure`, and `complete` callbacks in. This may also
		 *   be provided as `context` if you prefer. Defaults to this Model.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the reload completes. The Promise is both 
		 *   resolved or rejected with the arguments listed above in the method description.
		 */
		load : function( options ) {
			options = options || {};
			var emptyFn    = Data.emptyFn,
			    scope      = options.scope    || options.context || this,
			    successCb  = options.success  || emptyFn,
			    errorCb    = options.error    || emptyFn,
			    completeCb = options.complete || emptyFn,
			    deferred   = new jQuery.Deferred();
			
			// <debug>
			if( !this.proxy ) {
				throw new Error( "data.Model::load() error: Cannot load. No proxy configured." );
			}
			if( this.isNew() ) {
				throw new Error( "data.Model::load() error: Cannot load. Model does not have an idAttribute that relates to a valid attribute, or does not yet have a valid id (i.e. an id that is not null)." );
			}
			// </debug>
			
			// Attach any user-provided callbacks to the deferred.
			deferred
				.done( _.bind( successCb, scope ) )
				.fail( _.bind( errorCb, scope ) )
				.always( _.bind( completeCb, scope ) );
			
			// Set the `loading` flag while the Model is loading. Will be set to false in onLoadSuccess or onLoadError
			this.loading = true;
			this.fireEvent( 'loadbegin', this );
			
			// Make a request to load the data from the proxy
			var me = this,  // for closures
			    operation = new ReadOperation( { modelId: this.getId(), params: options.params } );
			this.proxy.read( operation ).then(
				function( operation ) { me.onLoadSuccess( deferred, operation ); },
				function( operation ) { me.onLoadError( deferred, operation ); }
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully loading a set of data as a result of the {@link #method-load}
		 * method being called.
		 * 
		 * Resolves the `jQuery.Deferred` object created by {@link #method-load}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the {@link #method-load} method. This 
		 *   Deferred will be resolved after post-processing of the successful load is complete.
		 * @param {data.persistence.operation.Read} operation The ReadOperation object which represents the load.
		 */
		onLoadSuccess : function( deferred, operation ) {
			this.set( operation.getResultSet().getRecords()[ 0 ] );
			this.loading = false;
			
			this.commit();
			
			deferred.resolve( this, operation ); 
			this.fireEvent( 'load', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to load a set of data as a result of the {@link #method-load} method 
		 * being called.
		 * 
		 * Rejects the `jQuery.Deferred` object created by {@link #method-load}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the {@link #method-load} method. This 
		 *   Deferred will be rejected after any post-processing.
		 * @param {data.persistence.operation.Read} operation The ReadOperation object which represents the load.
		 */
		onLoadError : function( deferred, operation ) {
			this.loading = false;
			
			deferred.reject( this, operation );
			this.fireEvent( 'load', this, operation );
		},
		
		
		/**
		 * Persists the Model data to persistent storage, using the configured {@link #proxy}. If the request to persist the Model's 
		 * data is successful, the Model's data will be {@link #method-commit committed} upon completion.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `model` : {@link data.Model} This Model instance.
		 * - `operation` : {@link data.persistence.operation.Write} The WriteOperation that was executed.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Boolean} [options.syncRelated=true] `true` to synchronize (persist) the "related" child models/collections 
		 *   of this Model (if it has any). Related models/collections must be stored under {@link data.attribute.Model}
		 *   or {@link data.attribute.Collection} Attributes for this to work. The models/collections that would be synchronized
		 *   would be the child models/{@link data.Collection collections} that are related to the Model (i.e. not 
		 *   {@link data.attribute.DataComponent#embedded embedded} in the Model). 
		 *   
		 *   Set to `false` to only save the data in this Model, leaving any related child models/collections to be persisted 
		 *   individually, at another time.
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Function} [options.success] Function to call if the save is successful.
		 * @param {Function} [options.error] Function to call if the save fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in. This may also
		 *   be provided as `context` if you prefer. Defaults to the Model.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the save completes. The Promise is both 
		 *   resolved or rejected with the arguments listed above in the method description.
		 */
		save : function( options ) {
			options = options || {};
			var me          = this,  // for closures
			    syncRelated = ( options.syncRelated === undefined ) ? true : options.syncRelated,  // defaults to true
			    emptyFn     = Data.emptyFn,
			    scope       = options.scope    || options.context || this,
			    successCb   = options.success  || emptyFn,
			    errorCb     = options.error    || emptyFn,
			    completeCb  = options.complete || emptyFn;
			
			// <debug>
			if( !this.proxy ) {
				// No proxy, cannot save. Throw an error
				throw new Error( "data.Model::save() error: Cannot save. No proxy." );
			}
			if( !this.hasIdAttribute() ) {
				// No id attribute, throw an error
				throw new Error( "data.Model::save() error: Cannot save. Model does not have an idAttribute that relates to a valid attribute." );
			}
			// </debug>
			
			// Set the `saving` flag while the Model is saving. Will be set to false in onSaveSuccess or onSaveError
			this.saving = true;
			this.fireEvent( 'savebegin', this );
			
			// First, synchronize any nested related (i.e. non-embedded) Models and Collections of the model.
			// Chain the synchronization of collections to the synchronization of this Model itself to create
			// the `modelSavePromise` (if the `syncRelated` option is true)
			var modelSavePromise;
			if( syncRelated ) {
				modelSavePromise = jQuery.when( this.syncRelatedCollections(), this.syncRelatedModels() ).then( function() { 
					return me.doSave( options ); 
			    } );
			} else {  // not synchronizing related collections/models
				modelSavePromise = this.doSave( options );
			}
			
			// Set up any callbacks provided in the options
			modelSavePromise
				.done( _.bind( successCb, scope ) )
				.fail( _.bind( errorCb, scope ) )
				.always( _.bind( completeCb, scope ) );
			
			return modelSavePromise;
		},
		
		
		/**
		 * Private utility method which is used to synchronize all of the nested related (i.e. not 'embedded') 
		 * collections for this Model. Returns a Promise object which is resolved when all collections have been 
		 * successfully synchronized.
		 * 
		 * @private
		 * @return {jQuery.Promise} A Promise object which is resolved when all collections have been successfully
		 *   synchronized. If any of the requests to synchronize collections should fail, the Promise will be rejected.
		 *   If there are no nested related collections, the promise is resolved immediately.
		 */
		syncRelatedCollections : function() {
			var collectionSyncPromises = [],
			    relatedCollectionAttributes = this.getRelatedCollectionAttributes();
			
			for( var i = 0, len = relatedCollectionAttributes.length; i < len; i++ ) {
				var collection = this.get( relatedCollectionAttributes[ i ].getName() );
				if( collection ) {  // make sure there is actually a Collection (i.e. it's not null)
					collectionSyncPromises.push( collection.sync() );
				}
			}
			
			// create and return single Promise object out of all the Collection synchronization promises
			return jQuery.when.apply( null, collectionSyncPromises );
		},
		
		
		/**
		 * Private utility method which is used to save all of the nested related (i.e. not 'embedded') 
		 * models for this Model. Returns a Promise object which is resolved when all models have been 
		 * successfully saved.
		 * 
		 * @private
		 * @return {jQuery.Promise} A Promise object which is resolved when all related models have been successfully
		 *   saved. If any of the requests to save a model should fail, the Promise will be rejected.
		 *   If there are no nested related models, the promise is resolved immediately.
		 */
		syncRelatedModels : function() {
			var modelSavePromises = [],
			    relatedModelAttributes = this.getRelatedModelAttributes();
			
			for( var i = 0, len = relatedModelAttributes.length; i < len; i++ ) {
				var model = this.get( relatedModelAttributes[ i ].getName() );
				if( model ) {  // make sure there is actually a Model (i.e. it's not null)
					modelSavePromises.push( model.save() );
				}
			}
			
			// create and return single Promise object out of all the Model save promises
			return jQuery.when.apply( null, modelSavePromises );
		},
		
		
		/**
		 * Private method that performs the actual save (persistence) of this Model. This method is called from 
		 * {@link #method-save} at the appropriate time. It is delayed from being called if the Model first has to 
		 * persist non-{@link data.attribute.DataComponent#embedded embedded}) child collections.
		 * 
		 * @private
		 * @param {Object} options The `options` object provided to the {@link #method-save} method.
		 * @return {jQuery.Promise} The observable Promise object which can be used to determine if the save call has 
		 *   completed successfully (`done` callback) or errored (`fail` callback), and to perform any actions that need to 
		 *   be taken in either case with the `always` callback.
		 */
		doSave : function( options ) {
			var me = this,   // for closures
			    deferred = new jQuery.Deferred();
			
			// Store a "snapshot" of the data that is being persisted. This is used to compare against the Model's current data at the time of when the persistence operation 
			// completes. Anything that does not match this persisted snapshot data must have been updated while the persistence operation was in progress, and the Model must 
			// be considered modified for those attributes after its commit() runs. This is a bit roundabout that a commit() operation runs when the persistence operation is complete
			// and then data is manually modified, but this is also the correct time to run the commit() operation, as we still want to see the changes if the request fails. 
			// So, if a persistence request fails, we should have all of the data still marked as modified, both the data that was to be persisted, and any new data that was set 
			// while the persistence operation was being attempted.
			var persistedData = _.cloneDeep( this.getData() );
			
			var handleServerUpdate = function( resultSet ) {  // accepts a data.persistence.ResultSet object
				var data = ( resultSet ) ? resultSet.getRecords()[ 0 ] : null;
				data = data || me.getData();  // no data returned, used the model's data. hack for now...
	
				// The request to persist the data was successful, commit the Model
				me.commit();
				
				// Loop over the persisted snapshot data, and see if any Model attributes were updated while the persistence request was taking place.
				// If so, those attributes should be marked as modified, with the snapshot data used as the "originals". See the note above where persistedData was set. 
				var currentData = me.getData();
				for( var attributeName in persistedData ) {
					if( persistedData.hasOwnProperty( attributeName ) && !_.isEqual( persistedData[ attributeName ], currentData[ attributeName ] ) ) {
						me.modifiedData[ attributeName ] = persistedData[ attributeName ];   // set the last persisted value on to the "modifiedData" object. Note: "modifiedData" holds *original* values, so that the "data" object can hold the latest values. It is how we know an attribute is modified as well.
					}
				}
			};
			
			
			// Make a request to create or update the data on the server
			var writeOperation = new WriteOperation( {
				models : [ this ],
				params : options.params
			} );
			this.proxy[ this.isNew() ? 'create' : 'update' ]( writeOperation ).then(
				function( operation ) { handleServerUpdate( operation.getResultSet() ); me.onSaveSuccess( deferred, operation ); },
				function( operation ) { me.onSaveError( deferred, operation ); }
			);
			
			return deferred.promise();  // return only the observable Promise object of the Deferred
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully saving the Model as a result of the {@link #method-save}
		 * method being called.
		 * 
		 * Resolves the `jQuery.Deferred` object created by {@link #method-save}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the {@link #method-save} method. This 
		 *   Deferred will be resolved after post-processing of the successful save is complete.
		 * @param {data.persistence.operation.Write} operation The WriteOperation object which represents the save.
		 */
		onSaveSuccess : function( deferred, operation ) {
			this.saving = false;
			
			deferred.resolve( this, operation ); 
			this.fireEvent( 'save', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to destroy the Model a result of the {@link #method-destroy} method 
		 * being called.
		 * 
		 * Rejects the `jQuery.Deferred` object created by {@link #method-save}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the {@link #method-save} method. This 
		 *   Deferred will be rejected after post-processing of the successful save is complete.
		 * @param {data.persistence.operation.Write} operation The WriteOperation object which represents the save.
		 */
		onSaveError : function( deferred, operation ) {
			this.saving = false;
			
			deferred.reject( this, operation );
			this.fireEvent( 'save', this, operation );
		},
		
		
		
		/**
		 * Destroys the Model on the backend, using the configured {@link #proxy}.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `model` : {@link data.Model} This Model instance.
		 * - `operation` : {@link data.persistence.operation.Write} The WriteOperation that was executed.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Function} [options.success] Function to call if the destroy (deletion) is successful.
		 * @param {Function} [options.error] Function to call if the destroy (deletion) fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in. This may also
		 *   be provided as `context` if you prefer. Defaults to the Model.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the destroy (deletion) completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 */
		destroy : function( options ) {
			options = options || {};
			var me          = this,   // for closures
			    emptyFn     = Data.emptyFn,
			    scope       = options.scope    || options.context || this,
			    successCb   = options.success  || emptyFn,
			    errorCb     = options.error    || emptyFn,
			    completeCb  = options.complete || emptyFn,
			    deferred    = new jQuery.Deferred();
			
			// No proxy, cannot destroy. Throw an error
			// <debug>
			if( !this.proxy ) {
				throw new Error( "data.Model::destroy() error: Cannot destroy model on server. No proxy." );
			}
			// </debug>
			
			// Attach any user-provided callbacks to the deferred.
			deferred
				.done( _.bind( successCb, scope ) )
				.fail( _.bind( errorCb, scope ) )
				.always( _.bind( completeCb, scope ) );
			
			// Set the `destroying` flag while the Model is destroying. Will be set to false in onDestroySuccess 
			// or onDestroyError
			this.destroying = true;
			this.fireEvent( 'destroybegin', this );
			
			var operation = new WriteOperation( {
				models : [ this ],
				params : options.params
			} );
			
			if( this.isNew() ) {
				// If it is a new model, there is nothing on the server to destroy. Simply fire the event and call the callback.
				operation.setSuccess();  // would normally be set by the proxy if we were making a request to it
				this.onDestroySuccess( deferred, operation );
				
			} else {
				// Make a request to destroy the data on the server
				this.proxy.destroy( operation ).then(
					function( operation ) { me.onDestroySuccess( deferred, operation ); },
					function( operation ) { me.onDestroyError( deferred, operation ); }
				);
			}
			
			return deferred.promise();  // return just the observable Promise object of the Deferred
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully destroying the Model as a result of the {@link #method-destroy}
		 * method being called.
		 * 
		 * Resolves the `jQuery.Deferred` object created by {@link #method-destroy}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the {@link #method-destroy} method. This 
		 *   Deferred will be resolved after post-processing of the successful destroy is complete.
		 * @param {data.persistence.operation.Write} operation The WriteOperation object which represents the destroy.
		 */
		onDestroySuccess : function( deferred, operation ) {
			this.destroying = false;
			this.destroyed = true;
			
			deferred.resolve( this, operation ); 
			this.fireEvent( 'destroy', this, operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to destroy the Model a result of the {@link #method-destroy} method 
		 * being called.
		 * 
		 * Rejects the `jQuery.Deferred` object created by {@link #method-destroy}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the {@link #method-destroy} method. This 
		 *   Deferred will be rejected after post-processing of the successful destroy is complete.
		 * @param {data.persistence.operation.Write} operation The WriteOperation object which represents the destroy.
		 */
		onDestroyError : function( deferred, operation ) {
			this.destroying = false;
			
			deferred.reject( this, operation );
			this.fireEvent( 'destroy', this, operation );
		},
		
		
		// ------------------------------------
		
		// Protected utility methods
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.DataComponent DataComponent Attributes}.
		 * 
		 * @protected
		 * @return {data.attribute.DataComponent[]}
		 */
		getDataComponentAttributes : function() {
			return _.filter( this.attributes, function( attr ) { return ( attr instanceof DataComponentAttribute ); } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.DataComponent DataComponent Attributes} 
		 * which are also {@link data.attribute.DataComponent#embedded}. This is a convenience method that supports the methods which
		 * use the embedded DataComponent Attributes. 
		 * 
		 * @protected
		 * @return {data.attribute.DataComponent[]} The array of embedded DataComponent Attributes.
		 */
		getEmbeddedDataComponentAttributes : function() {
			return _.filter( this.getDataComponentAttributes(), function( attr ) { return attr.isEmbedded(); } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Collection Collection Attributes}.
		 * 
		 * @protected
		 * @return {data.attribute.Collection[]}
		 */
		getCollectionAttributes : function() {
			return _.filter( this.attributes, function( attr ) { return attr instanceof CollectionAttribute; } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Collection Collection Attributes},
		 * but are *not* {@link data.attribute.Collection#embedded embedded} attributes (i.e. they are "related" attributes).
		 * 
		 * @protected
		 * @return {data.attribute.Collection[]} 
		 */
		getRelatedCollectionAttributes : function() {
			return _.filter( this.getCollectionAttributes(), function( attr ) { return !attr.isEmbedded(); } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Model Model Attributes}.
		 * 
		 * @protected
		 * @return {data.attribute.Model[]}
		 */
		getModelAttributes : function() {
			return _.filter( this.attributes, function( attr ) { return attr instanceof ModelAttribute; } );
		},
		
		
		/**
		 * Retrieves an array of the Attributes configured for this model that are {@link data.attribute.Collection Collection Attributes},
		 * but are *not* {@link data.attribute.Collection#embedded embedded} attributes (i.e. they are "related" attributes).
		 * 
		 * @protected
		 * @return {data.attribute.Collection[]} 
		 */
		getRelatedModelAttributes : function() {
			return _.filter( this.getModelAttributes(), function( attr ) { return !attr.isEmbedded(); } );
		}
		
	} );
	
	
	return Model;
	
} );

/*global define */
define('data/NativeObjectConverter', [
	'require',
	'lodash',
	'data/DataComponent',
	'data/Collection',  // circular dependency, not included in args list
	'data/Model'        // circular dependency, not included in args list
], function( require, _, DataComponent ) {
	
	/**
	 * @private
	 * @class data.NativeObjectConverter
	 * @singleton
	 * 
	 * NativeObjectConverter allows for the conversion of {@link data.Collection Collection} / {@link data.Model Models}
	 * to their native Array / Object representations, while dealing with circular dependencies.
	 */
	var NativeObjectConverter = {
		
		/**
		 * Converts a {@link data.Collection Collection} or {@link data.Model} to its native Array/Object representation,
		 * while dealing with circular dependencies.
		 *  
		 * @param {data.Collection/data.Model} A Collection or Model to convert to its native Array/Object representation.
		 * @param {Object} [options] An object (hashmap) of options to change the behavior of this method. This may include:
		 * @param {String[]} [options.attributeNames] In the case that a {@link data.Model Model} is provided to this method, this
		 *   may be an array of the attribute names that should be returned in the output object.  Other attributes will not be processed.
		 *   (Note: only affects the Model passed to this method, and not nested models.)
		 * @param {Boolean} [options.persistedOnly] True to have the method only return data for the persisted attributes on
		 *   Models (i.e. attributes with the {@link data.attribute.Attribute#persist persist} config set to true, which is the default).
		 * @param {Boolean} [options.raw] True to have the method only return the raw data for the attributes, by way of the {@link data.Model#raw} method. 
		 *   This is used for persistence, where the raw data values go to the server rather than higher-level objects, or where some kind of serialization
		 *   to a string must take place before persistence (such as for Date objects). 
		 *   
		 *   As a hack (unfortunately, due to limited time), if passing the 'raw' option as true, and a nested {@link data.Collection Collection} is in a 
		 *   {@link data.attribute.Collection} that is *not* {@link data.attribute.Collection#embedded}, then only an array of the 
		 *   {@link data.Model#idAttribute ID attribute} values is returned for that collection. The final data for a related (i.e. non-embedded) nested
		 *   Collection may look something like this:
		 *     
		 *     myRelatedCollection : [
		 *         { id: 1 },
		 *         { id: 2 }
		 *     ]
		 * 
		 * 
		 * @return {Object[]/Object} An array of objects (for the case of a Collection}, or an Object (for the case of a Model)
		 *   with the internal attributes converted to their native equivalent.
		 */
		convert : function( dataComponent, options ) {
			options = options || {};
			var Model = require( 'data/Model' ),
			    Collection = require( 'data/Collection' ),
			    cache = {},  // keyed by models' clientId, and used for handling circular dependencies
			    persistedOnly = !!options.persistedOnly,
			    raw = !!options.raw,
			    data = ( dataComponent instanceof Collection ) ? [] : {};  // Collection is an Array, Model is an Object
			
			// Prime the cache with the Model/Collection provided to this method, so that if a circular reference points back to this
			// model, the data object is not duplicated as an internal object (i.e. it should refer right back to the converted
			// Model's/Collection's data object)
			cache[ dataComponent.getClientId() ] = data;
			
			// Recursively goes through the data structure, and convert models to objects, and collections to arrays
			_.assign( data, (function convert( dataComponent, attribute ) {  // attribute is only used when processing models, and a nested collection is come across, where the data.attribute.Attribute is passed along for processing when 'raw' is provided as true. See doc for 'raw' option about this hack..
				var clientId, 
				    cachedDataComponent,
				    data,
				    i, len;
				
				if( dataComponent instanceof Model ) {
					// Handle Models
					var attributes = dataComponent.getAttributes(),
					    attributeNames = options.attributeNames || _.keys( attributes ),
					    attributeName, currentValue;
					
					data = {};  // data is an object for a Model
					
					// Slight hack, but delete options.attributeNames now, so that it is not used again for inner Models (should only affect the first 
					// Model that gets converted, i.e. the Model provided to this method)
					delete options.attributeNames;
					
					for( i = 0, len = attributeNames.length; i < len; i++ ) {
						attributeName = attributeNames[ i ];
						if( !persistedOnly || attributes[ attributeName ].isPersisted() === true ) {
							currentValue = data[ attributeName ] = ( raw ) ? dataComponent.raw( attributeName ) : dataComponent.get( attributeName );
							
							// Process Nested DataComponents
							if( currentValue instanceof DataComponent ) {
								clientId = currentValue.getClientId();
								
								if( ( cachedDataComponent = cache[ clientId ] ) ) {
									data[ attributeName ] = cachedDataComponent;
								} else {
									// first, set up an array/object for the cache (so it exists when checking for it in the next call to convert()), 
									// and set that array/object to the return data as well
									cache[ clientId ] = data[ attributeName ] = ( currentValue instanceof Collection ) ? [] : {};  // Collection is an Array, Model is an Object
									
									// now, populate that object with the properties of the inner object
									_.assign( cache[ clientId ], convert( currentValue, attributes[ attributeName ] ) );
								}
							}
						}
					}
					
				} else if( dataComponent instanceof Collection ) {
					// Handle Collections
					var models = dataComponent.getModels(),
					    model, idAttributeName;
					
					data = [];  // data is an array for a Container
					
					// If the 'attribute' argument to the inner function was provided (coming from a Model that is being converted), and the 'raw' option is true,
					// AND the collection is *not* an embedded collection (i.e. it is a "related" collection), then we only want the ID's of the models for the conversion.
					// See note about this hack in the doc comment for the method for the 'raw' option.
					if( options.raw && attribute && !attribute.isEmbedded() ) {
						for( i = 0, len = models.length; i < len; i++ ) {
							model = models[ i ];
							idAttributeName = model.getIdAttributeName();
							
							data[ i ] = {};
							data[ i ][ idAttributeName ] = model.get( idAttributeName );
						}
						
					} else { 
						// Otherwise, provide the models themselves
						for( i = 0, len = models.length; i < len; i++ ) {
							model = models[ i ];
							clientId = model.getClientId();
							
							data[ i ] = cache[ clientId ] || convert( model );
						}
					}
				}
				
				return data;
			})( dataComponent ) );
			
			return data;
		}
		
	};
	
	
	return NativeObjectConverter;
	
} );
/*global define */
define('data/persistence/operation/Batch', [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @class data.persistence.operation.Batch
	 * 
	 * Represents one or more {@link data.persistence.operation.Operation Operations} which were executed in a logical
	 * group.
	 * 
	 * The Batch object provides access to each {@link data.persistence.operation.Operation Operation}, and also provides
	 * methods for determining the overall success or failure (error) state of the Operations within it.
	 * 
	 * This class is mainly used internally by the library, and is provided to client code at the times when multiple
	 * {@link data.persistence.operation.Operation Operations} were needed to satisfy a request, so that it may be inspected
	 * for any needed information.
	 */
	var OperationBatch = Class.extend( Object, {
		
		/**
		 * @cfg {data.persistence.operation.Operation/data.persistence.operation.Operation[]} operations
		 * 
		 * One or more Operation(s) that make up the Batch.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
			
			// normalize the `operations` config to an array
			this.operations = ( this.operations ) ? [].concat( this.operations ) : [];
		},
		
		
		/**
		 * Retrieves all of the {@link #operations} for this Batch. 
		 * 
		 * @return {data.persistence.operation.Operation[]}
		 */
		getOperations : function() {
			return this.operations;
		},
		
		
		/**
		 * Determines if the Batch of {@link #operations} completed successfully. All {@link #operations}
		 * must have completed successfully for the Batch to be considered successful.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return !_.find( this.operations, function( op ) { return op.hasErrored(); } );  // _.find() returns `undefined` if no errored operations are found
		},
		
		
		/**
		 * Determines if the Batch failed to complete successfully. If any of the {@link #operations}
		 * has errored, this method returns true.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return !this.wasSuccessful();
		},
		
		
		/**
		 * Retrieves each {@link data.persistence.operation.Operation Operation} object that has completed
		 * successfully.
		 * 
		 * @return {data.persistence.operation.Operation[]} An array of the Operations which have completed
		 *   successfully.
		 */
		getSuccessfulOperations : function() {
			return _.filter( this.operations, function( op ) { return !op.hasErrored(); } );
		},
		
		
		/**
		 * Retrieves each {@link data.persistence.operation.Operation Operation} object that has errored.
		 * 
		 * @return {data.persistence.operation.Operation[]} An array of the Operations which have errored.
		 */
		getErroredOperations : function() {
			return _.filter( this.operations, function( op ) { return op.hasErrored(); } );
		},
		
		
		/**
		 * Determines if all {@link data.persistence.operation.Operation Operations} in the batch are complete.
		 * 
		 * @return {Boolean} `true` if all Operations are complete, `false` if any are not yet complete.
		 */
		isComplete : function() {
			return _.all( this.operations, function( op ) { return op.isComplete(); } );
		}
		
	} );
	
	return OperationBatch;
	
} );
/*global define */
define('data/Collection', [
	'require',
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/DataComponent',
	'data/NativeObjectConverter',
	'data/persistence/operation/Read',
	'data/persistence/operation/Write',
	'data/persistence/operation/Batch',
	'data/persistence/proxy/Proxy',
	'data/Model'   // may be circular dependency, depending on load order. require( 'data/Model' ) is used internally
], function(
	require,
	jQuery,
	_,
	Class,
	Data,
	DataComponent,
	NativeObjectConverter,
	ReadOperation,
	WriteOperation,
	OperationBatch,
	Proxy
) {

	/**
	 * @class data.Collection
	 * @extends data.DataComponent
	 * 
	 * Manages an ordered set of {@link data.Model Models}. This class itself is not meant to be used directly, 
	 * but rather extended and configured for the different collections in your application.
	 * 
	 * Ex:
	 *     
	 *     myApp.Todos = Collection.extend( {
	 *         model: myApp.Todo
	 *     } );
	 * 
	 * 
	 * Note: Configuration options should be placed on the prototype of a Collection subclass.
	 * 
	 * 
	 * ### Model Events
	 * 
	 * Collections automatically relay all of their {@link data.Model Models'} events as if the Collection
	 * fired it. The collection instance provides itself in the handler though. For example, Models' 
	 * {@link data.Model#event-change change} events:
	 *     
	 *     var Model = Model.extend( {
	 *         attributes: [ 'name' ]
	 *     } );
	 *     var Collection = Collection.extend( {
	 *         model : Model
	 *     } );
	 * 
	 *     var model1 = new Model( { name: "Greg" } ),
	 *         model2 = new Model( { name: "Josh" } );
	 *     var collection = new Collection( [ model1, model2 ] );
	 *     collection.on( 'change', function( collection, model, attributeName, newValue, oldValue ) {
	 *         console.log( "A model changed its '" + attributeName + "' attribute from '" + oldValue + "' to '" + newValue + "'" );
	 *     } );
	 * 
	 *     model1.set( 'name', "Gregory" );
	 *       // "A model changed its 'name' attribute from 'Greg' to 'Gregory'"
	 */
	var Collection = Class.extend( DataComponent, {
		
		inheritedStatics : {			
			
			/**
			 * Retrieves the {@link data.persistence.proxy.Proxy} that is configured for the Collection class. To retrieve
			 * a proxy that may belong to a particular collection, use the instance level {@link #method-getProxy}.
			 * 
			 * @inheritable
			 * @static
			 * @return {data.persistence.proxy.Proxy} The Proxy configured with the Model, or null.
			 */
			getProxy : function() {
				return this.prototype.proxy || null;
			}
			
		},

		
		/**
		 * @cfg {Function} model
		 * 
		 * The data.Model (sub)class which will be used to convert any anonymous data objects into
		 * its appropriate Model instance for the Collection. 
		 * 
		 * Note that if a factory method is required for the creation of models, where custom processing may be needed,
		 * override the {@link #createModel} method in a subclass.
		 * 
		 * It is recommended that you subclass data.Collection, and add this configuration as part of the definition of the 
		 * subclass. Ex:
		 * 
		 *     myApp.MyCollection = Collection.extend( {
		 *         model : myApp.MyModel
		 *     } );
		 */
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the Collection's data to/from persistent
		 * storage. If this is not configured, the proxy configured on the {@link #model} that this collection uses
		 * will be used instead. If neither are specified, the Collection may not {@link #method-load} or {@link #sync} its models. 
		 * 
		 * Note that this may be specified as part of a Collection subclass (so that all instances of the Collection inherit
		 * the proxy), or on a particular collection instance as a configuration option, or by using {@link #setProxy}.
		 */
		
		/**
		 * @cfg {Boolean} autoLoad
		 * 
		 * If no initial {@link #data} config is specified (specifying an initial set of data/models), and this config is 
		 * `true`, the Collection's {@link #method-load} method will be called immediately upon instantiation to load the 
		 * Collection.
		 * 
		 * If the {@link #pageSize} config is set, setting this to `true` will just cause the first page of
		 * data to be loaded. 
		 */
		autoLoad : false,
		
		/**
		 * @cfg {Number} pageSize
		 * 
		 * The number of models to load in a page when loading paged data (via {@link #loadPage}). This config
		 * must be set when loading paged data with {@link #loadPage}.
		 */
		
		/**
		 * @cfg {Boolean} clearOnPageLoad
		 * 
		 * `true` to remove all existing {@link data.Model Models} from the Collection when loading a new page of data 
		 * via {@link #loadPage}. This has the effect of only loading the requested page's models in the Collection. 
		 * Set to `false` to have the loaded models be added to the Collection, instead of replacing the existing ones.
		 */
		clearOnPageLoad : true,
		
		/**
		 * @cfg {Function} sortBy
		 * A function that is used to keep the Collection in a sorted ordering. Without one, the Collection will
		 * simply keep models in insertion order.
		 * 
		 * This function takes two arguments: each a {@link data.Model Model}, and should return `-1` if the 
		 * first model should be placed before the second, `0` if the models are equal, and `1` if the 
		 * first model should come after the second.
		 * 
		 * Ex:
		 *     
		 *     sortBy : function( model1, model2 ) { 
		 *         var name1 = model1.get( 'name' ),
		 *             name2 = model2.get( 'name' );
		 *         
		 *         return ( name1 < name2 ) ? -1 : ( name1 > name2 ) ? 1 : 0;
		 *     }
		 * 
		 * It is recommended that you subclass data.Collection, and add the sortBy function in the definition of the subclass. Ex:
		 * 
		 *     myApp.MyCollection = Collection.extend( {
		 *         sortBy : function( model1, model2 ) {
		 *             // ...
		 *         }
		 *     } );
		 *     
		 *     
		 *     // And instantiating:
		 *     var myCollection = new myApp.MyCollection();
		 */
		
		/**
		 * @cfg {Object/Object[]/data.Model/data.Model[]} data
		 * 
		 * Any initial data/models to load the Collection with. This is used when providing a configuration object to the 
		 * Collection constructor, instead of an array of initial data/models. Can be a single model, an array of models,
		 * or an object / array of objects that will be converted to models based on the {@link #model} config (or 
		 * overridden implementation of {@link #createModel}).
		 * 
		 * Ex:
		 * 
		 *     // Assuming you have created a myApp.MyModel subclass of {@link data.Model},
		 *     // and a myApp.MyCollection subclass of data.Collection
		 *     var model1 = new myApp.MyModel(),
		 *         model2 = new myApp.MyModel();
		 *     
		 *     var collection = new myApp.MyCollection( {
		 *         data: [ model1, model2 ]
		 *     } );
		 * 
		 * Ex 2:    
		 *     var MyModel = Model.extend( {
		 *         attributes : [ 'id', 'name' ]
		 *     } );
		 *     
		 *     var collection = new myApp.MyCollection( {
		 *         model : MyModel,
		 *         data: [
		 *             { id: 1, name: "John" },
		 *             { id: 2, name: "Jane" }
		 *         ]
		 *     } );
		 */
		
		
		
		/**
		 * @protected
		 * @property {data.Model[]} models
		 * 
		 * The array that holds the Models, in order.
		 */
		
		/**
		 * @protected
		 * @property {Object} modelsByClientId
		 * 
		 * An object (hashmap) of the models that the Collection is currently holding, keyed by the models' {@link data.Model#clientId clientId}.
		 */
		
		/**
		 * @protected
		 * @property {Object} modelsById
		 * 
		 * An object (hashmap) of the models that the Collection is currently holding, keyed by the models' {@link data.Model#id id}, if the model has one.
		 */
		
		/**
		 * @protected
		 * @property {data.Model[]} removedModels
		 * 
		 * An array that holds Models removed from the Collection, which haven't yet been {@link #sync synchronized} to the server yet (by 
		 * {@link data.Model#method-destroy destroying} them).
		 */
		
		/**
		 * @protected
		 * @property {Boolean} modified
		 * 
		 * Flag that is set to true whenever there is an addition, insertion, or removal of a model in the Collection.
		 */
		modified : false,
		
		/**
		 * @protected
		 * @property {Boolean} loading
		 * 
		 * Flag that is set to true when the Collection is loading data through its {@link #proxy}.
		 */
		loading : false,
		
		/**
		 * @protected
		 * @property {Number[]} loadedPages
		 * 
		 * An array that stores the currently-loaded pages in the Collection. This is only used when a {@link #pageSize}
		 * is set, and the user loads pages using the {@link #loadPage} or {@link #loadPageRange} methods.
		 */
		
		/**
		 * @protected
		 * @property {Number} totalCount
		 * 
		 * This property is used to keep track of total number of models in a windowed (paged) data 
		 * set. It will be set as the result of a {@link #method-load} operation that reads the total count
		 * from a property provided by the backing data store. If no such property existed in the data,
		 * this will be set to 0.
		 */
		
		
		
		/**
		 * Creates a new Collection instance.
		 * 
		 * @constructor
		 * @param {Object/Object[]/data.Model[]} config This can either be a configuration object (in which the options listed
		 *   under "configuration options" can be provided), or an initial set of Models to provide to the Collection. If providing
		 *   an initial set of data/models, they must be wrapped in an array. Note that an initial set of data/models can be provided 
		 *   when using a configuration object with the {@link #data} config.
		 */
		constructor : function( config ) {
			this.addEvents(
				/**
				 * Fires when one or more models have been added to the Collection. This event is fired once for each
				 * model that is added. To respond to a set of model adds all at once, use the {@link #event-addset} 
				 * event instead. 
				 * 
				 * @event add
				 * @param {data.Collection} collection This Collection instance.
				 * @param {data.Model} model The model instance that was added. 
				 */
				'add',
				
				/**
				 * Responds to a set of model additions by firing after one or more models have been added to the Collection. 
				 * This event fires with an array of the added model(s), so that the additions may be processed all at 
				 * once. To respond to each addition individually, use the {@link #event-add} event instead. 
				 * 
				 * @event addset
				 * @param {data.Collection} collection This Collection instance.
				 * @param {data.Model[]} models The array of model instances that were added. This will be an
				 *   array of the added models, even in the case that a single model is added.
				 */
				'addset',
				
				/**
				 * Fires when a model is reordered within the Collection. A reorder can be performed
				 * by calling the {@link #method-add} method with a given index of where to re-insert one or
				 * more models. If the model did not yet exist in the Collection, it will *not* fire a 
				 * reorder event, but will be provided with an {@link #event-add add} event instead. 
				 * 
				 * This event is fired once for each model that is reordered.
				 * 
				 * @event reorder
				 * @param {data.Collection} collection This Collection instance.
				 * @param {data.Model} model The model that was reordered.
				 * @param {Number} newIndex The new index for the model.
				 * @param {Number} oldIndex The old index for the model.
				 */
				'reorder',
				
				/**
				 * Fires when one or more models have been removed from the Collection. This event is fired once for each
				 * model that is removed. To respond to a set of model removals all at once, use the {@link #event-removeset} 
				 * event instead.
				 * 
				 * @event remove
				 * @param {data.Collection} collection This Collection instance.
				 * @param {data.Model} model The model instances that was removed.
				 * @param {Number} index The index that the model was removed from.
				 */
				'remove',
				
				/**
				 * Responds to a set of model removals by firing after one or more models have been removed from the Collection. 
				 * This event fires with an array of the removed model(s), so that the removals may be processed all at once. 
				 * To respond to each removal individually, use the {@link #event-remove} event instead.
				 * 
				 * @event removeset
				 * @param {data.Collection} collection This Collection instance.
				 * @param {data.Model[]} models The array of model instances that were removed. This will be an
				 *   array of the removed models, even in the case that a single model is removed.
				 */
				'removeset',
				
				/**
				 * Fires when the Collection begins a load request, through its {@link #proxy}. The {@link #event-load} event
				 * will fire when the load is complete.
				 * 
				 * @event loadbegin
				 * @param {data.Collection} This Collection instance.
				 */
				'loadbegin',
				
				/**
				 * Fires when the Collection is loaded from an external data source, through its {@link #proxy}.
				 * 
				 * This event fires for both successful and failed "load" requests. Success of the load request may 
				 * be determined using the `batch`'s {@link data.persistence.operation.Batch#wasSuccessful wasSuccessful} 
				 * method. Note that all Operations may not be {@link data.persistence.operation.Operation#isComplete complete}
				 * when this event fires if one or more Operations in the `batch` have errored.
				 * 
				 * @event load
				 * @param {data.Collection} collection This Collection instance.
				 * @param {data.persistence.operation.Batch} batch The Batch object which holds the 
				 *   {@link data.persistence.operation.Operation Operations} that were required to execute the load request. 
				 *   In most cases, this object will hold just one Operation.
				 */
				'load'
			);
			
			
			var initialModels;
			
			// If the "config" is an array, it must be an array of initial models
			if( _.isArray( config ) ) {
				initialModels = config;
				
			} else if( typeof config === 'object' ) {
				_.assign( this, config );
				
				initialModels = this.data;  // grab any initial data/models in the config
			}

			// Call Observable constructor
			this._super( arguments );
			
			
			// If a 'sortBy' exists, and it is a function, create a bound function to bind it to this Collection instance
			// for when it is passed into Array.prototype.sort()
			if( typeof this.sortBy === 'function' ) {
				this.sortBy = _.bind( this.sortBy, this );
			}
			
			
			this.models = [];
			this.modelsByClientId = {};
			this.modelsById = {};
			this.removedModels = [];
			this.loadedPages = [];
			
			if( initialModels ) {
				this.add( initialModels );
				this.modified = false;  // initial models should not make the collection "modified". Note: NOT calling commit() here, because we may not want to commit changed model data. Need to figure that out.
			} else {
				if( this.autoLoad ) {
					this.load();
				}
			}
			
			// Call hook method for subclasses
			this.initialize();
		},
		
		
		/**
		 * Hook method for subclasses to initialize themselves. This method should be overridden in subclasses to 
		 * provide any model-specific initialization.
		 * 
		 * Note that it is good practice to always call the superclass `initialize` method from within yours (even if
		 * your class simply extends data.Collection, which has no `initialize` implementation itself). This is to future proof it
		 * from being moved under another superclass, or if there is ever an implementation made in this class.
		 * 
		 * Ex:
		 * 
		 *     MyCollection = Collection.extend( {
		 *         initialize : function() {
		 *             MyCollection.superclass.initialize.apply( this, arguments );   // or could be MyCollection.__super__.initialize.apply( this, arguments );
		 *             
		 *             // my initialization logic goes here
		 *         }
		 *     }
		 * 
		 * @protected
		 * @method initialize
		 */
		initialize : Data.emptyFn,
		
		
		
		// -----------------------------
		
		
		/**
		 * If a model is provided as an anonymous data object, this method will be called to transform the data into 
		 * the appropriate {@link data.Model model} class, using the {@link #model} config.
		 * 
		 * This may be overridden in subclasses to allow for custom processing, or to create a factory method for Model creation.
		 * 
		 * @protected
		 * @param {Object} modelData
		 * @return {data.Model} The instantiated model.
		 */
		createModel : function( modelData ) {
			if( !this.model ) {
				throw new Error( "Cannot instantiate model from anonymous data, 'model' config not provided to Collection." );
			}
			
			return new this.model( modelData );
		},
		
		
		/**
		 * Adds one or more models to the Collection. The default behavior is to append the models, but the `at` option may be
		 * passed to insert them at a specific position. 
		 * 
		 * Models which already exist in the Collection will not be re-added (effectively making the addition of an existing model
		 * a no-op). However, if the `at` option is specified, it will be moved to that index.
		 * 
		 * This method fires the {@link #event-add add} event for models that are newly added, and the {@link #reorder} event for 
		 * models that are simply moved within the Collection. The latter event will only be fired if the `at` option is specified.
		 * 
		 * @param {data.Model/data.Model[]/Object/Object[]} models One or more models to add to the Collection. This may also
		 *   be one or more anonymous objects, which will be converted into models based on the {@link #model} config, or an
		 *   overridden {@link #createModel} method.
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Number} [options.at] The 0-based index for where to insert the model(s). This can be used to splice new models 
		 *   in at a certain position, or move existing models in the Collection to this position.
		 */
		add : function( models, options ) {
			options = options || {};
			var index = options.at,
			    indexSpecified = ( typeof index !== 'undefined' ),
			    collectionModels = this.models,
			    model,
			    modelId,
			    addedModels = [],
			    Model = require( 'data/Model' );  // reference to constructor function for instanceof check
			
			// First, normalize the `index` if it is out of the bounds of the models array
			if( typeof index !== 'number' ) {
				index = collectionModels.length;  // append by default
			} else if( index < 0 ) {
				index = 0;
			} else if( index > collectionModels.length ) {
				index = collectionModels.length;
			}
			
			// Normalize the argument to an array
			if( !_.isArray( models ) ) {
				models = [ models ];
			}
			
			// No models to insert, return
			if( models.length === 0 ) {
				return;
			}
			
			for( var i = 0, len = models.length; i < len; i++ ) {
				model = models[ i ];
				if( !( model instanceof Model ) ) {
					model = this.createModel( model );
				}
				
				// Only add if the model does not already exist in the collection
				if( !this.has( model ) ) {
					this.modified = true;  // model is being added, then the Collection has been modified
					
					addedModels.push( model );
					this.modelsByClientId[ model.getClientId() ] = model;
					
					// Insert the model into the models array at the correct position
					collectionModels.splice( index, 0, model );  // 0 elements to remove
					index++;  // increment the index for the next model to insert / reorder
					
					if( model.hasIdAttribute() ) {  // make sure the model actually has a valid idAttribute first, before trying to call getId()
						modelId = model.getId();
						if( modelId !== undefined && modelId !== null ) {
							this.modelsById[ modelId ] = model;
						}
						
						// Respond to any changes on the idAttribute
						model.on( 'change:' + model.getIdAttribute().getName(), this.onModelIdChange, this );
					}
					
					// Subscribe to the special 'all' event on the model, so that the Collection can relay all of the model's events
					model.on( 'all', this.onModelEvent, this );
					
					this.fireEvent( 'add', this, model );
					
				} else {
					// Handle a reorder, but only actually move the model if a new index was specified.
					// In the case that add() is called, no index will be specified, and we don't want to
					// "re-add" models
					if( indexSpecified ) {
						this.modified = true;  // model is being reordered, then the Collection has been modified
						
						var oldIndex = this.indexOf( model );
						
						// Move the model to the new index
						collectionModels.splice( oldIndex, 1 );
						collectionModels.splice( index, 0, model );
						
						this.fireEvent( 'reorder', this, model, index, oldIndex );
						index++; // increment the index for the next model to insert / reorder
					}
				}
			}
			
			// If there is a 'sortBy' config, use that now
			if( this.sortBy ) {
				collectionModels.sort( this.sortBy );  // note: the sortBy function has already been bound to the correct scope
			}
			
			// Fire the 'add' event for models that were actually inserted into the Collection (meaning that they didn't already
			// exist in the collection). Don't fire the event though if none were actually inserted (there could have been models
			// that were simply reordered).
			if( addedModels.length > 0 ) {
				this.fireEvent( 'addset', this, addedModels );
			}
		},
		
		
		
		/**
		 * Removes one or more models from the Collection. Fires the {@link #event-remove} event with the
		 * models that were actually removed.
		 * 
		 * @param {data.Model/data.Model[]} models One or more models to remove from the Collection.
		 */
		remove : function( models ) {
			var collectionModels = this.models,
			    removedModels = [],
			    i, len, model, modelIndex;
			
			// Normalize the argument to an array
			if( !_.isArray( models ) ) {
				models = [ models ];
			}
			
			for( i = 0, len = models.length; i < len; i++ ) {
				model = models[ i ];
				modelIndex = this.indexOf( model );
				
				// Don't bother doing anything to remove the model if we know it doesn't exist in the Collection
				if( modelIndex > -1 ) {
					this.modified = true;  // model is being removed, then the Collection has been modified
					
					delete this.modelsByClientId[ model.getClientId() ];
					
					if( model.hasIdAttribute() ) {   // make sure the model actually has a valid idAttribute first, before trying to call getId()
						delete this.modelsById[ model.getId() ];
						
						// Remove the listener for changes on the idAttribute
						model.un( 'change:' + model.getIdAttribute().getName(), this.onModelIdChange, this );
					}
					
					// Unsubscribe the special 'all' event listener from the model
					model.un( 'all', this.onModelEvent, this );
					
					// Remove the model from the models array
					collectionModels.splice( modelIndex, 1 );
					this.fireEvent( 'remove', this, model, modelIndex );
					
					removedModels.push( model );
					this.removedModels.push( model );  // Add reference to the model just removed, for when synchronizing the collection (using sync()). This is an array of all non-destroyed models that have been removed from the Collection, and is reset when those models are destroyed.
				}
			}
			
			if( removedModels.length > 0 ) {
				this.fireEvent( 'removeset', this, removedModels );
			}
		},
		
		
		/**
		 * Removes all models from the Collection. Fires the {@link #event-remove} event with the models
		 * that were removed.
		 */
		removeAll : function() {
			this.remove( _.clone( this.models ) );  // make a shallow copy of the array to send to this.remove()
		},
		
		
		/**
		 * Handles a change to a model's {@link data.Model#idAttribute}, so that the Collection's 
		 * {@link #modelsById} hashmap can be updated.
		 * 
		 * Note that {@link #onModelEvent} is still called even when this method executes.
		 * 
		 * @protected
		 * @param {data.Model} model The model that fired the change event.
		 * @param {Mixed} newValue The new value.
		 * @param {Mixed} oldValue The old value. 
		 */
		onModelIdChange : function( model, newValue, oldValue ) {
			delete this.modelsById[ oldValue ];
			
			if( newValue !== undefined && newValue !== null ) {
				this.modelsById[ newValue ] = model;
			}
		},
		
		
		/**
		 * Handles an event fired by a Model in the Collection by relaying it from the Collection
		 * (as if the Collection had fired it).
		 * 
		 * @protected
		 * @param {String} eventName
		 * @param {Mixed...} args The original arguments passed to the event.
		 */
		onModelEvent : function( eventName ) {
			// If the model was destroyed, we need to remove it from the collection
			if( eventName === 'destroy' ) {
				var model = arguments[ 1 ];  // arguments[ 1 ] is the model for the 'destroy' event
				this.remove( model );   // if the model is destroyed on its own, remove it from the collection. If it has been destroyed from the collection's sync() method, then this will just have no effect.
				
				// If the model was destroyed manually on its own, remove the model from the removedModels array, so we don't try to destroy it (again)
				// when sync() is executed.
				var removedModels = this.removedModels;
				for( var i = 0, len = removedModels.length; i < len; i++ ) {
					if( removedModels[ i ] === model ) {
						removedModels.splice( i, 1 );
						break;
					}
				}
			}
			
			// Relay the event from the collection, passing the collection itself, and the original arguments
			this.fireEvent.apply( this, [ eventName, this ].concat( Array.prototype.slice.call( arguments, 1 ) ) );
		},
		
		
		// ----------------------------
		
		
		/**
		 * Retrieves the Model at a given index.
		 * 
		 * @param {Number} index The index to to retrieve the model at.
		 * @return {data.Model} The Model at the given index, or null if the index was out of range.
		 */
		getAt : function( index ) {
			return this.models[ index ] || null;
		},
		
		
		/**
		 * Convenience method for retrieving the first {@link data.Model model} in the Collection.
		 * If the Collection does not have any models, returns null.
		 * 
		 * @return {data.Model} The first model in the Collection, or null if the Collection does not have
		 *   any models.
		 */
		getFirst : function() {
			return this.models[ 0 ] || null;
		},
		
		
		/**
		 * Convenience method for retrieving the last {@link data.Model model} in the Collection.
		 * If the Collection does not have any models, returns null.
		 * 
		 * @return {data.Model} The last model in the Collection, or null if the Collection does not have
		 *   any models.
		 */
		getLast : function() {
			return this.models[ this.models.length - 1 ] || null;
		},
		
		
		/**
		 * Retrieves a range of {@link data.Model Models}, specified by the `startIndex` and `endIndex`. These values are inclusive.
		 * For example, if the Collection has 4 Models, and `getRange( 1, 3 )` is called, the 2nd, 3rd, and 4th models will be returned.
		 * 
		 * @param {Number} [startIndex=0] The starting index.
		 * @param {Number} [endIndex] The ending index. Defaults to the last Model in the Collection.
		 * @return {data.Model[]} The array of models from the `startIndex` to the `endIndex`, inclusively.
		 */
		getRange : function( startIndex, endIndex ) {
			var models = this.models,
			    numModels = models.length,
			    range = [],
			    i;
			
			if( numModels === 0 ) {
				return range;
			}
			
			startIndex = Math.max( startIndex || 0, 0 ); // don't allow negative indexes
			endIndex = Math.min( typeof endIndex === 'undefined' ? numModels - 1 : endIndex, numModels - 1 );
			
			for( i = startIndex; i <= endIndex; i++ ) {
				range.push( models[ i ] );
			}
			return range; 
		},
		
		
		/**
		 * Determines if the Collection holds the range of {@link data.Model Models} specified by the `startIndex` and
		 * `endIndex`. If one or more {@link data.Model Models} are missing from the given range, this method returns
		 * `false`.
		 * 
		 * @param {Number} startIndex The starting index.
		 * @param {Number} [endIndex] The ending index. Defaults to the last Model in the Collection.
		 * @return {Boolean} `true` if the Collection has {@link data.Model Models} in all indexes specified by
		 *   the range of `startIndex` to `endIndex`, or `false` if one or more {@link data.Model Models} are missing.
		 */
		hasRange : function( startIndex, endIndex ) {
			// A bit of a naive implementation for now. In the future, this method will cover when say, pages
			// are loaded out of order, and will ensure that the entire range is present.
			return endIndex < this.models.length;
		},
		
		
		/**
		 * Determines if the Collection has the given page number loaded. This is only valid when a {@link #pageSize} is set,
		 * and using the paging methods {@link #loadPage} or {@link #loadPageRange}.
		 * 
		 * @param {Number} pageNum The page number to check.
		 * @return {Boolean} `true` if the Collection has the given `pageNum` currently loaded, `false` otherwise.
		 */
		hasPage : function( pageNum ) {
			return _.contains( this.loadedPages, pageNum );
		},
		
		
		/**
		 * Retrieves all of the models that the Collection has, in order.
		 * 
		 * @return {data.Model[]} An array of the models that this Collection holds.
		 */
		getModels : function() {
			return this.getRange();  // gets all models
		},
		
		
		/**
		 * Retrieves the Array representation of the Collection, where all models are converted into native JavaScript Objects.  The attribute values
		 * for each of the models are retrieved via the {@link data.Model#get} method, to pre-process the data before they are returned in the final 
		 * array of objects, unless the `raw` option is set to true, in which case the Model attributes are retrieved via {@link data.Model#raw}. 
		 * 
		 * @override
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object[]} An array of the Object representation of each of the Models in the Collection.
		 */
		getData : function( options ) {
			return NativeObjectConverter.convert( this, options );
		},

		
		
		/**
		 * Retrieves the number of models that the Collection currently holds.
		 * 
		 * @return {Number} The number of models that the Collection currently holds.
		 */
		getCount : function() {
			return this.models.length;
		},
		
		
		/**
		 * Retrieves the *total* number of models that the {@link #proxy} indicates exists on a backing
		 * data store. This is used when loading windowed (paged) data sets, and differs from 
		 * {@link #getCount} in that it loads the number of models that *could* be loaded into the
		 * Collection if the Collection contained all of the data on the backing store.
		 * 
		 * If looking to determine how many models are loaded at the current moment, use {@link #getCount}
		 * instead.
		 * 
		 * @return {Number} The number of models that the {@link #proxy} has indicated exist on the a
		 *   backing data store. If the {@link #proxy proxy's} {@link data.persistence.reader.Reader Reader}
		 *   did not read any metadata about the total number of models, this method returns `undefined`.
		 */
		getTotalCount : function() {
			return this.totalCount;
		},
		
		
		/**
		 * Retrieves a Model by its {@link data.Model#clientId clientId}.
		 * 
		 * @param {String} clientId
		 * @return {data.Model} The Model with the given {@link data.Model#clientId clientId}, or null if there is 
		 *   no Model in the Collection with that {@link data.Model#clientId clientId}.
		 */
		getByClientId : function( clientId ) {
			return this.modelsByClientId[ clientId ] || null;
		},
		
		
		/**
		 * Retrieves a Model by its {@link data.Model#id id}. Note: if the Model does not yet have an id, it will not
		 * be able to be retrieved by this method.
		 * 
		 * @param {Mixed} id The id value for the {@link data.Model Model}.
		 * @return {data.Model} The Model with the given {@link data.Model#id id}, or `null` if no Model was found 
		 *   with that {@link data.Model#id id}.
		 */
		getById : function( id ) {
			return this.modelsById[ id ] || null;
		},
		
		
		/**
		 * Determines if the Collection has a given {@link data.Model model}.
		 * 
		 * @param {data.Model} model
		 * @return {Boolean} True if the Collection has the given `model`, false otherwise.
		 */
		has : function( model ) {
			return !!this.getByClientId( model.getClientId() );
		},
		
		
		/**
		 * Retrieves the index of the given {@link data.Model model} within the Collection. 
		 * Returns -1 if the `model` is not found.
		 * 
		 * @param {data.Model} model
		 * @return {Number} The index of the provided `model`, or of -1 if the `model` was not found.
		 */
		indexOf : function( model ) {
			var models = this.models,
			    i, len;
			
			if( !this.has( model ) ) {
				// If the model isn't in the Collection, return -1 immediately
				return -1;
				
			} else {
				for( i = 0, len = models.length; i < len; i++ ) {
					if( models[ i ] === model ) {
						return i;
					}
				}
			}
		},
		
		
		/**
		 * Retrieves the index of a given {@link data.Model model} within the Collection by its
		 * {@link data.Model#idAttribute id}. Returns -1 if the `model` is not found.
		 * 
		 * @param {Mixed} id The id value for the model.
		 * @return {Number} The index of the model with the provided `id`, or of -1 if the model was not found.
		 */
		indexOfId : function( id ) {
			var model = this.getById( id );
			if( model ) {
				return this.indexOf( model );
			}
			return -1;
		},
		
		
		// ----------------------------
		
		
		/**
		 * Commits any changes in the Collection, so that it is no longer considered "modified".
		 * 
		 * @override
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Boolean} [options.shallow=false] True to only commit only the additions/removals/reorders
		 *   of the Collection itself, but not its child Models.
		 */
		commit : function( options ) {
			options = options || {};
			
			this.modified = false;  // reset flag
			
			if( !options.shallow ) {
				var models = this.models;
				for( var i = 0, len = models.length; i < len; i++ ) {
					models[ i ].commit();
				}
			}
		},
		
		
		
		/**
		 * Rolls any changes to the Collection back to its state when it was last {@link #commit committed}
		 * or rolled back.
		 */
		rollback : function() {
			this.modified = false;  // reset flag
			
			// TODO: Implement rolling back the collection's state to the array of models that it had before any
			// changes were made
			
			
			// TODO: Determine if child models should also be rolled back. Possibly a flag argument for this?
			// But for now, maintain consistency with isModified()
			var models = this.models;
			for( var i = 0, len = models.length; i < len; i++ ) {
				models[ i ].rollback();
			}
		},
		
		
		/**
		 * Determines if the Collection has been added to, removed from, reordered, or 
		 * has any {@link data.Model models} which are modified.
		 * 
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This may be provided as the first argument to the
		 *   method if no `attributeName` is to be provided. Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true only if a Model exists within it that has a 
		 *   {@link data.attribute.Attribute#persist persisted} attribute which is modified. However, if the Collection itself has been modified
		 *   (by adding/reordering/removing a Model), this method will still return true.
		 * @param {Boolean} [options.shallow=false] True to only check if the Collection itself has been added to, remove from, or has had its Models
		 *   reordered. The method will not check child models if they are modified.
		 * 
		 * @return {Boolean} True if the Collection has any modified models, false otherwise.
		 */
		isModified : function( options ) {
			options = options || {};
			
			// First, if the collection itself has been added to / removed from / reordered, then it is modified
			if( this.modified ) {
				return true;
				
			} else if( !options.shallow ) {
				// Otherwise, check to see if any of its child models are modified.
				var models = this.models,
				    i, len;
				
				for( i = 0, len = models.length; i < len; i++ ) {
					if( models[ i ].isModified( options ) ) {
						return true;
					}
				}
				return false;
			}
		},
		
		
		// ----------------------------
		
		// Searching methods
		
		/**
		 * Finds the first {@link data.Model Model} in the Collection by {@link data.attribute.Attribute Attribute} name, and a given value.
		 * Uses `===` to compare the value. If a more custom find is required, use {@link #findBy} instead.
		 * 
		 * Note that this method is more efficient than using {@link #findBy}, so if it can be used, it should.
		 * 
		 * @param {String} attributeName The name of the attribute to test the value against.
		 * @param {Mixed} value The value to look for.
		 * @param {Object} [options] Optional arguments for this method, provided in an object (hashmap). Accepts the following:
		 * @param {Number} [options.startIndex] The index in the Collection to start searching from.
		 * @return {data.Model} The model where the attribute name === the value, or `null` if no matching model was not found.
		 */
		find : function( attributeName, value, options ) {
			options = options || {};
			
			var models = this.models,
			    startIndex = options.startIndex || 0;
			for( var i = startIndex, len = models.length; i < len; i++ ) {
				if( models[ i ].get( attributeName ) === value ) {
					return models[ i ];
				}
			}
			return null;
		},
		
		
		/**
		 * Finds the first {@link data.Model Model} in the Collection, using a custom function. When the function returns true,
		 * the model is returned. If the function does not return true for any models, `null` is returned.
		 * 
		 * @param {Function} fn The function used to find the Model. Should return an explicit boolean `true` when there is a match. 
		 *   This function is passed the following arguments:
		 * @param {data.Model} fn.model The current Model that is being processed in the Collection.
		 * @param {Number} fn.index The index of the Model in the Collection.
		 * 
		 * @param {Object} [options]
		 * @param {Object} [options.scope] The scope to run the function in. Defaults to the Collection.
		 * @param {Number} [options.startIndex] The index in the Collection to start searching from.
		 * 
		 * @return {data.Model} The model that the function returned `true` for, or `null` if no match was found.
		 */
		findBy : function( fn, options ) {
			options = options || {};
			
			var models = this.models,
			    scope = options.scope || this,
			    startIndex = options.startIndex || 0;
			    
			for( var i = startIndex, len = models.length; i < len; i++ ) {
				if( fn.call( scope, models[ i ], i ) === true ) {
					return models[ i ];
				}
			}
			return null;
		},
		
		
		// ----------------------------
		
		// Persistence functionality
			
		/**
		 * Sets the {@link data.persistence.proxy.Proxy} that for this particular collection instance. Setting a proxy
		 * with this method will only affect this particular collection instance, not any others.
		 * 
		 * To configure a proxy that will be used for all instances of the Collection, set one in a Collection sublass.
		 * 
		 * @param {data.persistence.proxy.Proxy} The Proxy to set to this collection instance.
		 */
		setProxy : function( proxy ) {
			this.proxy = proxy;
		},
		
			
		/**
		 * Retrieves the {@link data.persistence.proxy.Proxy} that is configured for this collection instance. To retrieve
		 * the proxy that belongs to the Collection class itself, use the static {@link #static-method-getProxy getProxy} 
		 * method. Note that unless the collection instance is configured with a different proxy, it will inherit the
		 * Collection's static proxy.
		 * 
		 * @return {data.persistence.proxy.Proxy} The Proxy configured for the collection, or null.
		 */
		getProxy : function() {
			// Lazy instantiate an anonymous config object to a Proxy instance
			var proxy = this.proxy;
			if( _.isPlainObject( proxy ) ) {
				this.proxy = proxy = Proxy.create( proxy );
			}
			return proxy || null;
		},
		
		
		/**
		 * Determines if the Collection is currently loading data from its {@link #proxy}, via any of the "load" methods
		 * ({@link #method-load}, {@link #loadRange}, {@link #loadPage}, or {@link #loadPageRange}).
		 * 
		 * @return {Boolean} `true` if the Collection is currently loading a set of data, `false` otherwise.
		 */
		isLoading : function() {
			return this.loading;
		},
		
		
		/**
		 * Loads the Collection using its configured {@link #proxy}. If there is no configured {@link #proxy}, the
		 * {@link #model model's} proxy will be used instead.
		 * 
		 * This method makes a call to the {@link #proxy proxy's} {@link data.persistence.proxy.Proxy#read read} method to
		 * perform the load operation. Normally, the entire backend collection is read by the proxy when this method is called.
		 * However, if the Collection is configured with a {@link #pageSize}, then only page 1 of the data will be requested
		 * instead. You may load other pages of the data using {@link #loadPage} in this case.
		 * 
		 * Loading a Collection is asynchronous, and either callbacks must be provided to the method, or handlers must 
		 * attached to the returned `jQuery.Promise` object to determine when the loading is complete.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `collection` : {@link data.Collection} This Collection instance.
		 * - `batch` : {@link data.persistence.operation.Batch} The Batch of {@link data.persistence.operation.Read Read Operation(s)}
		 *   that were executed.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Boolean} [options.addModels=false] `true` to add the loaded models to the Collection instead of 
		 *   replacing the existing ones. 
		 * @param {Function} [options.success] Function to call if the loading is successful.
		 * @param {Function} [options.error] Function to call if the loading fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless
		 *   of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in.
		 *   This may also be provided as the property `context`, if you prefer. Defaults to this Collection.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the load completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 */
		load : function( options ) {
			// If loading paged data (there is a `pageSize` config on the Collection), then automatically just load page 1
			if( this.pageSize ) {
				return this.loadPage( 1, options );
				
			} else {
				options = this.normalizeLoadOptions( options );
				var me = this,  // for closures
				    deferred = new jQuery.Deferred(),
				    operation = new ReadOperation( { params: options.params } ),
				    batch = new OperationBatch( { operations: operation } );
				
				// Attach user-provided callbacks to the deferred. The `scope` was attached to each of these in normalizeLoadOptions()
				deferred.done( options.success ).fail( options.error ).always( options.complete );
				
				this.doLoad( operation ).then(
					function( operation ) { me.onLoadSuccess( deferred, batch, { addModels: !!options.addModels } ); },
					function( operation ) { me.onLoadError( deferred, batch ); }
				);
				return deferred.promise();
			}
		},
		
		
		/**
		 * Loads a specific range of models in the Collection using its configured {@link #proxy}. If there is no configured 
		 * {@link #proxy}, the {@link #model model's} proxy will be used instead.
		 * 
		 * If paging is used to load the Collection (i.e. a {@link #pageSize} config is specified), then the Collection will
		 * make the requests necessary to load all of the pages that will satisfy the desired range specified by the `startIdx`
		 * and `endIdx` arguments. If paging is not used, then the Collection will simply make a single start/limit request of the 
		 * {@link #proxy} for the desired range.
		 * 
		 * Loading a Collection is asynchronous, and either callbacks must be provided to the method, or handlers must 
		 * attached to the returned `jQuery.Promise` object to determine when the loading is complete.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `collection` : {@link data.Collection} This Collection instance.
		 * - `batch` : {@link data.persistence.operation.Batch} The Batch of {@link data.persistence.operation.Read Read Operation(s)}
		 *   that were executed.
		 * 
		 * @param {Number} startIdx The starting index of the range of models to load.
		 * @param {Number} endIdx The ending index of the range of models to load.
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Boolean} [options.addModels] `true` to add the loaded models to the Collection instead of replacing
		 *   the existing ones. If not provided, the method follows the behavior of the {@link #clearOnPageLoad} config
		 *   if page-based loading is being used (i.e. there is a {@link #pageSize} config), or defaults to false otherwise.
		 * @param {Function} [options.success] Function to call if the loading is successful.
		 * @param {Function} [options.error] Function to call if the loading fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless
		 *   of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in.
		 *   This may also be provided as the property `context`, if you prefer. Defaults to this Collection.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the load completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 */
		loadRange : function( startIdx, endIdx, options ) {
			var pageSize = this.pageSize;
			if( pageSize ) {
				// If paging is used to load records in the Collection, load the range of pages that satisfies
				// the range of record indexes required.
				var startPage = Math.floor( startIdx / pageSize ) + 1,
				    endPage = Math.floor( endIdx / pageSize ) + 1;
				
				return this.loadPageRange( startPage, endPage, options );
				
			} else {
				options = this.normalizeLoadOptions( options );
				var operation = new ReadOperation( {
					params : options.params,
					
					start : startIdx,
					limit : endIdx - startIdx
				} );
				
				var me = this,  // for closures
				    deferred = new jQuery.Deferred(),
				    batch = new OperationBatch( { operations: operation } );
				
				// Attach user-provided callbacks to the deferred. The `scope` was attached to each of these in normalizeLoadOptions()
				deferred.done( options.success ).fail( options.error ).always( options.complete );
				
				this.doLoad( operation ).then(
					function( operation ) { me.onLoadSuccess( deferred, batch, { addModels: !!options.addModels } ); },
					function( operation ) { me.onLoadError( deferred, batch ); }
				);
				return deferred.promise();
			}
		},
		
		
		/**
		 * Loads a page of the Collection using its configured {@link #proxy}. If there is no configured {@link #proxy}, the
		 * {@link #model model's} proxy will be used instead. The {@link #pageSize} must be configured on the Collection
		 * for this method to work.
		 * 
		 * Loading a Collection is asynchronous, and either callbacks must be provided to the method, or handlers must 
		 * attached to the returned `jQuery.Promise` object to determine when the loading is complete.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `collection` : {@link data.Collection} This Collection instance.
		 * - `batch` : {@link data.persistence.operation.Batch} The Batch of {@link data.persistence.operation.Read Read Operation(s)}
		 *   that were executed.
		 * 
		 * @param {Number} page The 1-based page number of data to load. Page `1` is the first page.
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Boolean} [options.addModels] `true` to add the loaded models to the Collection instead of replacing
		 *   the existing ones. If not provided, the method follows the behavior of the {@link #clearOnPageLoad} config.
		 * @param {Function} [options.success] Function to call if the loading is successful.
		 * @param {Function} [options.error] Function to call if the loading fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless
		 *   of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in.
		 *   This may also be provided as the property `context`, if you prefer. Defaults to this Collection.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the load completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 */
		loadPage : function( page, options ) {
			// <debug>
			if( !page ) {
				throw new Error( "'page' argument required for loadPage() method, and must be > 0" );
			}
			// </debug>
			
			return this.loadPageRange( page, page, options );  // startPage and endPage are the same
		},
		
		
		/**
		 * Loads a range of pages of the Collection using its configured {@link #proxy}. If there is no configured {@link #proxy}, the
		 * {@link #model model's} proxy will be used instead. The {@link #pageSize} must be configured on the Collection
		 * for this method to work.
		 * 
		 * Loading a Collection is asynchronous, and either callbacks must be provided to the method, or handlers must 
		 * attached to the returned `jQuery.Promise` object to determine when the loading is complete.
		 * 
		 * All of the callbacks, and the promise handlers are called with the following arguments:
		 * 
		 * - `collection` : {@link data.Collection} This Collection instance.
		 * - `batch` : {@link data.persistence.operation.Batch} The Batch of {@link data.persistence.operation.Read Read Operation(s)}
		 *   that were executed.
		 * 
		 * @param {Number} startPage The 1-based page number of the first page of data to load. Page `1` is the first page.
		 * @param {Number} endPage The 1-based page number of the last page of data to load. Page `1` is the first page.
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Object} [options.params] Any additional parameters to pass along to the configured {@link #proxy}
		 *   for the operation. See {@link data.persistence.operation.Operation#params} for details.
		 * @param {Boolean} [options.addModels] `true` to add the loaded models to the Collection instead of replacing
		 *   the existing ones. If not provided, the method follows the behavior of the {@link #clearOnPageLoad} config.
		 * @param {Function} [options.success] Function to call if the loading is successful.
		 * @param {Function} [options.error] Function to call if the loading fails.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless
		 *   of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in.
		 *   This may also be provided as the property `context`, if you prefer. Defaults to this Collection.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the load completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 */
		loadPageRange : function( startPage, endPage, options ) {
			var pageSize = this.pageSize;
			
			// <debug>
			if( !startPage || !endPage ) {
				throw new Error( "`startPage` and `endPage` arguments required for loadPageRange() method, and must be > 0" );
			}
			if( !pageSize ) {
				throw new Error( "The `pageSize` config must be set on the Collection to load paged data." );
			}
			// </debug>
			
			options = this.normalizeLoadOptions( options );
			var me = this,  // for closures
			    deferred = new jQuery.Deferred(),
			    operations = [],
			    loadPromises = [],
			    addModels = options.hasOwnProperty( 'addModels' ) ? options.addModels : !this.clearOnPageLoad;
			
			for( var page = startPage; page <= endPage; page++ ) {
				var operation = new ReadOperation( {
					params    : options.params,
					
					page     : page,
					pageSize : pageSize,
					start    : ( page - 1 ) * pageSize,
					limit    : pageSize   // in this case, the `limit` is the pageSize
				} );
				
				operations.push( operation );  // for populating the Batch that represents all Operations
				loadPromises.push( this.doLoad( operation ) );  // load the page of data, and store its returned Promise
			}
			
			var batch = new OperationBatch( { operations: operations } ),
			    masterPromise = jQuery.when.apply( null, loadPromises );
			
			// Attach user-provided callbacks to the deferred. The `scope` was attached to each of these in normalizeLoadOptions()
			deferred.done( options.success ).fail( options.error ).always( options.complete );
			
			masterPromise.then(
				function( operation ) {
					var loadedPages = _.range( startPage, endPage+1 );  // second arg needs +1 because it is "up to but not included"
					me.loadedPages = ( addModels ) ? me.loadedPages.concat( loadedPages ) : loadedPages;
					
					me.onLoadSuccess( deferred, batch, { addModels: addModels } ); 
				},
				function( operation ) { 
					me.onLoadError( deferred, batch );
				}
			);
			return deferred.promise();
		},
		
		
		/**
		 * Performs the actual load operation for a request to {@link #method-load} or {@link #method-loadPage}, given the
		 * `operation` object.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Read} operation The Read operation for the load.
		 * @return {jQuery.Promise} A Promise object which is resolved if the load completes successfully, or rejected
		 *   otherwise. The Promise is resolved or rejected with the argument: `operation`.
		 */
		doLoad : function( operation ) {
			var me = this,  // for closures
			    proxy = this.getProxy() || ( this.model ? this.model.getProxy() : null );
			
			// <debug>
			// No persistence proxy, cannot load. Throw an error
			if( !proxy ) {
				throw new Error( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			}
			// </debug>
			
			// Set the loading flag while the Collection is loading. Will be set to false in onLoadSuccess() or onLoadError().
			if( !this.loading ) {   // only set the flag and fire the event if the collection is not already loading for another request (i.e. should only fire once even if multiple pages are being loaded)
				this.loading = true;
				this.fireEvent( 'loadbegin', this );
			}
			
			// Make a request to read the data from the persistent storage, and return a Promise object
			// which is resolved or rejected with the `operation` object
			return proxy.read( operation );
		},
		
		
		/**
		 * Handles the {@link #proxy} successfully loading a set of data as a result of any of the "load"
		 * methods being called ({@link #method-load}, {@link #loadRange}, {@link #loadPage}, or {@link #loadPageRange}).
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the "load" method. This Deferred will be
		 *   resolved after post-processing of the successful load is complete.
		 * @param {data.persistence.operation.Batch} batch The Batch object which holds all of the 
		 *   {@link data.persistence.operation.Operation Operations} which were required to complete the load request.
		 * @param {Object} options An Object (map) with options for this method. Note that this is not the same as the `options`
		 *   object provided to each of the "load" methods. This object may contain the following properties:
		 * @param {Boolean} [options.addModels=false] `true` to add the loaded models to the Collection instead of 
		 *   replacing the existing ones. 
		 */
		onLoadSuccess : function( deferred, batch, options ) {
			var operations = batch.getOperations();
			
			// Sample the first load Operation for a totalCount
			var totalCount = operations[ 0 ].getResultSet().getTotalCount();
			if( totalCount !== undefined ) {
				this.totalCount = totalCount;
			}
			
			// If we're not adding the models, clear the Collection first
			if( !options.addModels ) {
				this.removeAll();
			}
			
			// Create a single array of all of the loaded records, put together in order of the operations, and then
			// add them to the Collection.
			var records = _.flatten(
				_.map( operations, function( op ) { return op.getResultSet().getRecords(); } )  // create an array of the arrays of result sets (to be flattened after)
			);
			this.add( records );
			
			this.loading = false;
			
			deferred.resolve( this, batch );
			this.fireEvent( 'load', this, batch );
		},
		
		
		/**
		 * Handles the {@link #proxy} failing to load a set of data as a result of any of the "load"
		 * methods being called ({@link #method-load}, {@link #loadRange}, {@link #loadPage}, or {@link #loadPageRange}.
		 * 
		 * Rejects the `jQuery.Deferred` object created by {@link #method-load}.
		 * 
		 * @protected
		 * @param {jQuery.Deferred} deferred The Deferred object created in the "load" method. This Deferred will 
		 *   be rejected after any post-processing.
		 * @param {data.persistence.operation.Batch} batch The Batch object which holds all of the 
		 *   {@link data.persistence.operation.Operation Operations} which were required to complete the load request.
		 *   One or more of these Operations has errored. Note that all Operations may not be complete.
		 */
		onLoadError : function( deferred, batch ) {
			this.loading = false;
			
			deferred.reject( this, batch );
			this.fireEvent( 'load', this, batch );
		},
		
		
		/**
		 * Normalizes the `options` argument to each of the "load" methods. This includes the {@link #method-load},
		 * {@link #loadRange}, {@link #loadPage}, and {@link #loadPageRange} methods.
		 * 
		 * This method only operates on the properties listed below. It provides a default empty function for each of the 
		 * `success`, `error`, and `complete` functions, and binds them to the `scope` (or `context`). All other properties
		 * that exist on the `options` object will remain unchanged. 
		 * 
		 * @protected
		 * @param {Object} options The options object provided to any of the "load" methods. If `undefined` or `null` is
		 *   provided, a normalized options object will still be returned, simply with defaults filled out.
		 * @param {Function} [options.success] Function to call if the loading is successful. Will be defaulted to an
		 *   empty function as part of this method's normalization process.
		 * @param {Function} [options.error] Function to call if the loading fails. Will be defaulted to an
		 *   empty function as part of this method's normalization process.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless
		 *   of success or failure. Will be defaulted to an empty function as part of this method's normalization process.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in.
		 *   This may also be provided as the property `context`. Defaults to this Collection. This method binds each of
		 *   the callbacks to this object.
		 * @return {Object} The normalize `options` object.
		 */
		normalizeLoadOptions : function( options ) {
			options = options || {};
			
			var emptyFn = function() {},
			    scope   = options.scope || options.context || this;
			
			options.success  = _.bind( options.success  || emptyFn, scope );
			options.error    = _.bind( options.error    || emptyFn, scope );
			options.complete = _.bind( options.complete || emptyFn, scope );
			
			return options;
		},
		
		
		/**
		 * Synchronizes the Collection by persisting each of the {@link data.Model Models} that have changes. New Models are created,
		 * existing Models are modified, and removed Models are deleted.
		 * 
		 * - `collection` : {@link data.Collection} This Collection instance.
		 * - `operation` : {@link data.persistence.operation.Write} The WriteOperation that was executed.
		 * 
		 * @param {Object} [options] An object which may contain the following properties:
		 * @param {Function} [options.success] Function to call if the synchronization is successful.
		 * @param {Function} [options.error] Function to call if the synchronization fails. The sychronization will be considered
		 *   failed if one or more Models does not persist successfully.
		 * @param {Function} [options.complete] Function to call when the operation is complete, regardless of success or failure.
		 * @param {Object} [options.scope] The object to call the `success`, `error`, and `complete` callbacks in. This may also
		 *   be provided as the property `context`, if you prefer. Defaults to the Collection.
		 * @return {jQuery.Promise} A Promise object which may have handlers attached for when the sync completes. The 
		 *   Promise is both resolved or rejected with the arguments listed above in the method description.
		 */
		sync : function( options ) {
			options = options || {};
			var scope = options.scope || options.context || this;
			
			
			var models = this.getModels(),
			    newModels = [],
			    modifiedModels = [],
			    removedModels = this.removedModels,
			    i, len;
			
			// Put together an array of all of the new models, and the modified models
			for( i = 0, len = models.length; i < len; i++ ) {
				var model = models[ i ];
				
				if( model.isNew() ) {
					newModels.push( model );
				} else if( model.isModified( { persistedOnly: true } ) ) {  // only check "persisted" attributes
					modifiedModels.push( model );
				}
			}
			
			
			// Callbacks for the options to this function
			var successCallback = function() {
				if( options.success ) { options.success.call( scope ); }
			};
			var errorCallback = function() {
				if( options.error ) { options.error.call( scope ); }
			};
			var completeCallback = function() {
				if( options.complete ) { options.complete.call( scope ); }
			};
			
			// A callback where upon successful destruction of a model, remove the model from the removedModels array, so that we don't try to destroy it again from another call to sync()
			var destroySuccess = function( model ) {
				for( var i = 0, len = removedModels.length; i < len; i++ ) {
					if( removedModels[ i ] === model ) {
						removedModels.splice( i, 1 );
						break;
					}
				}
			};
			
			
			// Now synchronize the models
			var promises = [],
			    modelsToSave = newModels.concat( modifiedModels );
			
			for( i = 0, len = modelsToSave.length; i < len; i++ ) {
				var savePromise = modelsToSave[ i ].save();
				promises.push( savePromise );
			}
			for( i = removedModels.length - 1; i >= 0; i-- ) {  // Loop this one backwards, as destroyed models will be removed from the array as they go if they happen synchronously
				var destroyPromise = removedModels[ i ].destroy();
				destroyPromise.done( destroySuccess );  // Upon successful destruction, we want to remove the model from the removedModels array, so that we don't try to destroy it again
				promises.push( destroyPromise );
			}
			
			// The "overall" promise that will either succeed if all persistence requests are made successfully, or fail if just one does not.
			var overallPromise = jQuery.when.apply( null, promises );  // apply all of the promises as arguments
			overallPromise.done( successCallback, completeCallback );
			overallPromise.fail( errorCallback, completeCallback );
			
			return overallPromise;  // Return a jQuery.Promise object for all the promises
		}
	
	} );
	
	return Collection;
	
} );
/*global define */
define('data/persistence/proxy/Ajax', [
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/persistence/proxy/Proxy'
], function( jQuery, _, Class, Data, Proxy ) {
	
	/**
	 * @class data.persistence.proxy.Ajax
	 * @extends data.persistence.proxy.Proxy
	 * 
	 * Ajax proxy is responsible for performing CRUD operations through standard AJAX, using the url(s) configured,
	 * and providing any parameters and such which are required for the backend service.
	 * 
	 * The Ajax proxy must be configured with the appropriate parameter names in order for it to automatically supply
	 * those parameters as part of its requests. For example, the {@link #pageParam} must be configured for the Ajax
	 * proxy to automatically add a page number parameter to the request URL.
	 */
	var AjaxProxy = Class.extend( Proxy, {
		
		/**
		 * @cfg {String} url
		 * 
		 * The URL of where to request data from. This URL can be overridden for any particular CRUD (create,
		 * read, update, destroy) method by using the {@link #api} config.
		 */
		
		/**
		 * @cfg {Object} api
		 * 
		 * Specific URLs to use for each CRUD (create, read, update, destroy) method. Defaults to:
		 * 
		 *     api : {
		 *         create  : undefined,
		 *         read    : undefined,
		 *         update  : undefined,
		 *         destroy : undefined
		 *     }
		 *     
		 * The URL that is used depends on the method being executed ({@link #create}, {@link #read}, 
		 * {@link #update}, or {@link #destroy}). 
		 * 
		 * An example configuration may be:
		 * 
		 *     api : {
		 *         create  : '/users/new',
		 *         read    : '/users/load',
		 *         update  : '/users/update',
		 *         destroy : '/users/delete
		 *     }
		 *     
		 * If a URL does not exist in the api map for the method being executed, the {@link #url} config 
		 * will be used instead. This allows the {@link #url} config to be used for all api methods.
		 */
		
		/**
		 * @cfg {Object} defaultParams
		 * 
		 * An Object (map) of any default parameters to include with every request. `params` provided to individual
		 * requests will override default parameters of the same name.
		 * 
		 * Ex:
		 * 
		 *     defaultParams : {
		 *         returnType : 'json'
		 *     }
		 *     
		 * Note that the values of these parameters will be URL encoded, if the default behavior of serializing the
		 * parameters as a query string is not overridden by a new {@link #serializeParams} implementation.
		 */
		
		/**
		 * @cfg {String} createMethod
		 * 
		 * The HTTP method to use to when creating a {@link data.Model Model} on the server. This may be 
		 * overridden for custom implementations.
		 */
		createMethod : 'POST',
		
		/**
		 * @cfg {String} readMethod
		 * 
		 * The HTTP method to use to when reading a {@link data.Model Model} or {@link data.Collection} 
		 * from the server. This may be overridden for custom implementations.
		 */
		readMethod : 'GET',
		
		/**
		 * @cfg {String} updateMethod
		 * 
		 * The HTTP method to use to when updating a {@link data.Model Model} on the server. This may be 
		 * overridden for custom implementations.
		 */
		updateMethod : 'POST',
		
		/**
		 * @cfg {String} destroyMethod
		 * 
		 * The HTTP method to use to when destroying a {@link data.Model Model} on the server. This may be 
		 * overridden for custom implementations.
		 */
		destroyMethod : 'POST',
		
		/**
		 * @cfg {String} idParam
		 * 
		 * The name of the parameter to pass the id of a particular model that is being operated on. For example,
		 * when loading a single {@link data.Model Model}, a request may be generated as: `/users/load?id=42`
		 */
		idParam : 'id',
		
		/**
		 * @cfg {String} pageParam
		 * 
		 * The name of the parameter to pass the page number when loading a paged data set. If this config is not provided,
		 * no page number parameter will be included in requests.
		 * 
		 * For example, if this config is set to 'page', and a page 10 of data is being loaded (via {@link data.Collection#loadPage}), 
		 * a request may be generated as: `/posts/load?page=10`
		 * 
		 * (A `pageParam` config must be provided if loading pages of data in this manner.) 
		 */
		
		/**
		 * @cfg {String} pageSizeParam
		 * 
		 * The name of the parameter to pass the page size when loading a paged data set. If this config is not provided,
		 * no page size parameter will be included in requests.
		 * 
		 * For example, if this config is set to 'pageSize', and a page of data is being loaded (via {@link data.Collection#loadPage}), 
		 * a request may be generated as: `/posts/load?pageSize=50`
		 */
		
		
		/**
		 * @protected
		 * @property {Function} ajax
		 * 
		 * A reference to the AJAX function to use for persistence. This is normally left as jQuery.ajax,
		 * but is changed for unit tests.
		 */
		ajax : jQuery.ajax,
		
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			this._super( arguments );
			
			this.api = this.api || {};
			this.defaultParams = this.defaultParams || {};
		},
		
		
		
		/**
		 * Creates the Model on the server.
		 * 
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be created on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		create : function( operation ) {
			throw new Error( "create() not yet implemented" );
		},
		
		
		/**
		 * Reads one or more {@link data.Model Models} from the server.
		 * 
		 * @param {data.persistence.operation.Read} operation The ReadOperation instance that describes the 
		 *   model(s) to be read from the server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		read : function( operation ) {
			var me = this,  // for closures
			    paramsObj = this.buildParams( 'read', operation ),
			    deferred = new jQuery.Deferred();
			
			this.ajax( {
				url      : this.buildUrl( 'read', operation ),
				type     : this.getHttpMethod( 'read' ),
				data     : this.serializeParams( paramsObj, 'read', operation ),  // params will be appended to URL on 'GET' requests, or put into the request body on 'POST' requests (dependent on `readMethod` config)
				dataType : 'text'
			} ).then(
				function( data, textStatus, jqXHR ) {
					operation.setResultSet( me.reader.read( data ) );
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
		 * are persisted.
		 * 
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be updated on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		update : function( operation, options ) {
			throw new Error( "update() not yet implemented" );
		},
		
		
		/**
		 * Destroys (deletes) the Model on the server.
		 * 
		 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be destroyed on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function( operation ) {
			throw new Error( "destroy() not yet implemented" );
		},
		
		
		// -----------------------------------
		
		// Note: No setDefaultParams() method so that the Proxy is immutable, and can be shared between many Model
		//       and Collection instances.
		
		
		/**
		 * Builds the full URL that will be used for any given CRUD (create, read, update, destroy) request. This will
		 * be the base url provided by either the {@link #api} or {@link #url} configs, plus any parameters that need
		 * to be added based on the `operation` provided.
		 * 
		 * @protected
		 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
		 * @param {data.persistence.operation.Read/data.persistence.operation.Write} operation
		 * @return {String} The full URL, with all parameters.
		 */
		buildUrl : function( action, operation ) {
			var url = this.getUrl( action );
			
			// Only add params explicitly to the URL when doing a create/update/destroy operation. For a 'read' 
			// operation, params will be added conditionally to either the url or the post body based on the http 
			// method being used ('GET' or 'POST', handled in the read() method itself). 
			if( action !== 'read' ) {
				var params = this.buildParams( action, operation );
				
				url = this.urlAppend( url, this.serializeParams( params, action, operation ) );
			}
			return url;
		},
		
		
		/**
		 * Builds the parameters for a given `operation`. By default, the `operation`'s params are combined
		 * with the Proxy's {@link #defaultParams}, and then any additional parameters for paging and such are
		 * added.
		 * 
		 * @protected
		 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
		 * @param {data.persistence.operation.Read/data.persistence.operation.Write} operation
		 * @return {Object} An Object (map) of the parameters, where the keys are the parameter names,
		 *   and the values are the parameter values.
		 */
		buildParams : function( action, operation ) {
			var params = _.assign( {}, this.defaultParams, operation.getParams() || {} );   // build the params map
			
			// Add the model's `id` and the paging parameters for 'read' operations only
			if( action === 'read' ) {
				var modelId = operation.getModelId(),
				    page = operation.getPage(),
				    pageSize = operation.getPageSize(),
				    pageParam = this.pageParam,
				    pageSizeParam = this.pageSizeParam;
				
				if( modelId !== null ) 
					params[ this.idParam ] = modelId;
				
				if( page > 0 && pageParam ) {   // an actual page was requested, and there is a pageParam config defined
					params[ pageParam ] = page;
				}
				if( pageSize > 0 && pageSizeParam ) {
					params[ pageSizeParam ] = pageSize;
				}
			}
			
			return params;
		},
		
		
		/**
		 * Serializes the parameters for an operation. The default implementation of this method is to serialize
		 * them into a query string, but may be overridden to support other formats.
		 * 
		 * @protected
		 * @param {Object} params The Object (map) of parameters to serialize. The keys of this map are the parameter names,
		 *   and the values are the parameter values.
		 * @param {String} action The action that is being taken. One of: 'create', 'read', 'update', or 'destroy'.
		 * @param {data.persistence.operation.Read/data.persistence.operation.Write} operation
		 * @return {String} The serialized string of parameters.
		 */
		serializeParams : function( params, action, operation ) {
			return this.objToQueryString( params );
		},
		
		
		/**
		 * Retrieves the URL to use for the given CRUD (create, read, update, destroy) operation. This is based on 
		 * either the {@link #api} (if there is a URL defined for the given `action`), or otherwise, the {@link #url} config.
		 * 
		 * @protected
		 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
		 * @return {String} The URL to use for the given `action`.
		 */
		getUrl : function( action ) {
			var url = this.api[ action ] || this.url;
			
			// <debug>
			if( !url ) 
				throw new Error( "No url found for action method '" + action + "'. Need to configure ajax proxy with `url` and/or `api` configs" );
			// </debug>
			
			return url;
		},
		
		
		/**
		 * Retrieves the HTTP method that should be used for a given action ('create', 'read', 'update', or 'destroy'). 
		 * The return value is dependent on the values of the {@link #createMethod}, {@link #readMethod}, 
		 * {@link #updateMethod}, and {@link #destroyMethod} configs.
		 * 
		 * @protected
		 * @param {String} action The action that is being taken. Should be 'create', 'read', 'update', or 'destroy'.
		 * @return {String} The HTTP method that should be used, based on the appropriate config (see above).
		 */
		getHttpMethod : function( action ) {
			return this[ action + 'Method' ];  // ex: this.createMethod, this.readMethod, this.updateMethod, or this.destroyMethod
		},
		
		
		// -------------------------------------
		
		
		/**
		 * Utility method which appends a query string of arguments to an existing url. Will append with the
		 * '&' character if there is already a query string separator in the url ('?'), or otherwise will append
		 * with the query string separator.
		 * 
		 * Ex:
		 *     
		 *     this.urlAppend( 'http://www.yahoo.com/', 'x=1&y=2' );
		 *     // <- http://www.yahoo.com/?x=1&y=2
		 *     
		 *     this.urlAppend( 'http://www.yahoo.com/?x=1', 'y=2&z=3' );
		 *     // <- http://www.yahoo.com/?x=1&y=2&z=3
		 *     
		 * @param {String} url The url string to append to.
		 * @param {String} queryString The query string to append.
		 * @return The `url` + `queryString`, with the correct separator character.
		 */
		urlAppend : function( url, queryString ) {
			if( queryString ) {
				var indexOfQuestionMark = url.indexOf( '?' ),
				    separatorChar = '';
				
				if( indexOfQuestionMark === -1 ) {
					separatorChar = '?';
				} else if( indexOfQuestionMark < url.length - 1 ) {
					// Only adding the '&' separator char if the the '?' is in the string, but is *not* the last char (i.e. there is 
					// no query string value yet, but the url already has the correct '?' separator char)
					separatorChar = '&';
				}
				
				url += separatorChar + queryString;
			}
			
			return url;
		},
		
		
		/**
		 * Converts an Object (map) of properties and values into a query string.
		 * 
		 * @protected
		 * @param {Object} obj
		 * @return {String} The keys/values of the `obj` in the format "key=value&key2=value2".
		 */
		objToQueryString : function( obj ) {
			// Map the object to an array of query string params
			var arr = _.map( obj, function( value, prop ) {
				return prop + '=' + encodeURIComponent( value );
			} );
			return arr.join( '&' );
		}
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'ajax', AjaxProxy );
	
	return AjaxProxy;
	
} );
/*global define */
define('data/persistence/proxy/Rest', [
	'jquery',
	'lodash',
	'Class',
	'data/persistence/proxy/Proxy',
	'data/persistence/proxy/Ajax'
], function( jQuery, _, Class, Proxy, AjaxProxy ) {
	
	/**
	 * @class data.persistence.proxy.Rest
	 * @extends data.persistence.proxy.Ajax
	 * 
	 * RestProxy is responsible for performing CRUD operations in a RESTful manner for a given Model on the server.
	 */
	var RestProxy = Class.extend( AjaxProxy, {
		
		/**
		 * @cfg {String} urlRoot
		 * The url to use in a RESTful manner to perform CRUD operations. Ex: `/tasks`.
		 * 
		 * The {@link data.Model#idAttribute id} of the {@link data.Model} being read/updated/deleted
		 * will automatically be appended to this url. Ex: `/tasks/12`
		 */
		urlRoot : "",
		
		/**
		 * @cfg {Boolean} incremental
		 * True to have the RestProxy only provide data that has changed to the server when
		 * updating a model. By using this, it isn't exactly following REST per se, but can
		 * optimize requests by only providing a subset of the full model data. Only enable
		 * this if your server supports this.
		*/
		incremental : false,
		
		/**
		 * @cfg {String} rootProperty
		 * If the server requires the data to be wrapped in a property of its own, use this config
		 * to specify it. For example, if PUT'ing a Task's data needs to look like this, use this config:
		 * 
		 *     {
		 *         "task" : {
		 *             "text" : "Do Something",
		 *             "isDone" : false
		 *         }
		 *     }
		 * 
		 * This config should be set to "task" in this case.
		 */
		rootProperty : "",
		
		/**
		 * @cfg
		 * @inheritdoc
		 */
		createMethod : 'POST',

		/**
		 * @cfg
		 * @inheritdoc
		 */
		readMethod : 'GET',

		/**
		 * @cfg
		 * @inheritdoc
		 */
		updateMethod : 'PUT',

		/**
		 * @cfg
		 * @inheritdoc
		 */
		destroyMethod : 'DELETE',
		
		
		/**
		 * Accessor to set the {@link #rootProperty} after instantiation.
		 * 
		 * @method setRootProperty
		 * @param {String} rootProperty The new {@link #rootProperty} value. This can be set to an empty string 
		 *   to remove the {@link #rootProperty}.
		 */
		setRootProperty : function( rootProperty ) {
			this.rootProperty = rootProperty;
		},
		
		
		/**
		 * Creates the Model on the server.
		 * 
		 * @method create
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be created on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		create : function( operation ) {
			var me = this,  // for closures
			    deferred = new jQuery.Deferred(),
			    model = operation.getModels()[ 0 ],
			    dataToPersist = model.getData( { persistedOnly: true, raw: true } );
			
			// Handle needing a different "root" wrapper object for the data
			if( this.rootProperty ) {
				var dataWrap = {};
				dataWrap[ this.rootProperty ] = dataToPersist;
				dataToPersist = dataWrap;
			}
			
			this.ajax( {
				url         : this.buildUrl( 'create', model.getId() ),
				type        : this.getHttpMethod( 'create' ),
				dataType    : 'text',
				data        : JSON.stringify( dataToPersist ),
				contentType : 'application/json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					if( data ) {  // data may or may not be returned by a server on a 'create' request
						operation.setResultSet( me.reader.read( data ) );
					}
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Reads the Model from the server.
		 * 
		 * @method read
		 * @param {data.persistence.operation.Read} operation The ReadOperation instance that holds the model(s) 
		 *   to be read from the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		read : function( operation ) {
			var me = this,  // for closures
			    deferred = new jQuery.Deferred();
			
			this.ajax( {
				url      : this.buildUrl( 'read', operation.getModelId() ),
				type     : this.getHttpMethod( 'read' ),
				dataType : 'json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					operation.setResultSet( me.reader.read( data ) );
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
		 * are persisted.
		 * 
		 * @method update
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be updated on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		update : function( operation, options ) {
			options = options || {};
			var me = this,  // for closures
			    scope = options.scope || options.context || this,
			    model = operation.getModels()[ 0 ],
			    changedData = model.getChanges( { persistedOnly: true, raw: true } ),
			    deferred = new jQuery.Deferred();
			
			// Short Circuit: If there is no changed data in any of the attributes that are to be persisted, there is no need to make a 
			// request. Resolves the deferred and return out.
			if( _.isEmpty( changedData ) ) {
				deferred.resolve( operation );
				return deferred.promise();
			}
			
			
			// Set the data to persist, based on if the persistence proxy is set to do incremental updates or not
			var dataToPersist;
			if( this.incremental ) {
				dataToPersist = changedData;   // uses incremental updates, we can just send it the changes
			} else {
				dataToPersist = model.getData( { persistedOnly: true, raw: true } );  // non-incremental updates, provide all persisted data
			}
			
			
			// Handle needing a different "root" wrapper object for the data
			if( this.rootProperty ) {
				var dataWrap = {};
				dataWrap[ this.rootProperty ] = dataToPersist;
				dataToPersist = dataWrap;
			}
			
			
			// Finally, persist to the server
			this.ajax( {
				url         : this.buildUrl( 'update', model.getId() ),
				type        : this.getHttpMethod( 'update' ),
				dataType    : 'text',
				data        : JSON.stringify( dataToPersist ),
				contentType : 'application/json'
			} ).then(
				function( data, textStatus, jqXHR ) {
					if( data ) {  // data may or may not be returned by a server on an 'update' request
						operation.setResultSet( me.reader.read( data ) );
					}
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		/**
		 * Destroys (deletes) the Model on the server.
		 * 
		 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @method destroy
		 * @param {data.persistence.operation.Write} operation The WriteOperation instance that holds the model(s) 
		 *   to be destroyed on the REST server.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function( operation ) {
			var deferred = new jQuery.Deferred(),
			    model = operation.getModels()[ 0 ];
			
			this.ajax( {
				url      : this.buildUrl( 'destroy', model.getId() ),
				type     : this.getHttpMethod( 'destroy' ),
				dataType : 'text'  // in case the server returns nothing. Otherwise, jQuery might make a guess as to the wrong data type (such as JSON), and try to parse it, causing the `error` callback to be executed instead of `success`
			} ).then(
				function( data, textStatus, jqXHR ) {
					operation.setSuccess();
					deferred.resolve( operation );
				},
				function( jqXHR, textStatus, errorThrown ) {
					operation.setException( { textStatus: textStatus, errorThrown: errorThrown } );
					deferred.reject( operation );
				}
			);
			
			return deferred.promise();
		},
		
		
		// -------------------
		
		
		/**
		 * Builds the URL to use to do CRUD operations.
		 * 
		 * @protected
		 * @method buildUrl
		 * @param {String} action The action being taken. Must be one of: 'create', 'read', 'update', or 'destroy'.
		 * @param {String} modelId The ID for the model that a url is being built for.
		 * @return {String} The url to use.
		 */
		buildUrl : function( action, modelId ) {
			var url = this.urlRoot;
			
			// Use the model's ID to set the url if we're not creating.
			// In the read case where there is no particular model to load (i.e. loading a collection),
			// then we skip this as well, as we want to load *all* (or at least a range of) models of the 
			// particular resource.
			if( action !== 'create' && modelId ) {
				if( !url.match( /\/$/ ) ) {
					url += '/';  // append trailing slash if it's not there
				}
				
				url += encodeURIComponent( modelId );
			}
			
			return url;
		}
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'rest', RestProxy );
	
	return RestProxy;
	
} );
require(["data/Collection", "data/Data", "data/DataComponent", "data/Model", "data/NativeObjectConverter", "data/attribute/Attribute", "data/attribute/Boolean", "data/attribute/Collection", "data/attribute/DataComponent", "data/attribute/Date", "data/attribute/Float", "data/attribute/Integer", "data/attribute/Mixed", "data/attribute/Model", "data/attribute/Number", "data/attribute/Object", "data/attribute/Primitive", "data/attribute/String", "data/persistence/ResultSet", "data/persistence/operation/Batch", "data/persistence/operation/Operation", "data/persistence/operation/Read", "data/persistence/operation/Write", "data/persistence/proxy/Ajax", "data/persistence/proxy/Proxy", "data/persistence/proxy/Rest", "data/persistence/reader/Json", "data/persistence/reader/Reader"]);
