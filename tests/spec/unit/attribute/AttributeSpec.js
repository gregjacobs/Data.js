/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/attribute/Attribute'
], function( Model, Attribute ) {
	
	describe( "unit.attribute.Attribute", function() {
		
		// A concrete Attribute subclass used for testing
		var ConcreteAttribute = Attribute.extend( {} );
		
		
		describe( "constructor", function() {
			
			it( "Instantiating an Attribute without a 'name' should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute();
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
			
			it( "Instantiating an Attribute with an undefined 'name' argument should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute( undefined );
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
			
			it( "Instantiating an Attribute with an undefined 'name' property should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute( {
						name : undefined
					} );
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
			
			it( "Instantiating an Attribute with a null 'name' argument should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute( null );
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
			
			it( "Instantiating an Attribute with a null 'name' property should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute( {
						name : null
					} );
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
			
			it( "Instantiating an Attribute with an empty 'name' argument should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute( "" );
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
			
			it( "Instantiating an Attribute with an empty 'name' property should throw an error", function() {
				expect( function() {
					var attribute = new ConcreteAttribute( {
						name : ""
					} );
				} ).toThrow( "no 'name' property provided to data.attribute.Attribute constructor" );
			} );
			
		} );
		
		
		describe( 'getName()', function() {
			
			it( "The name property should be retrievable by getName()", function() {
				var attribute1 = new ConcreteAttribute( { name: 'testName' } );
				expect( attribute1.getName() ).toBe( 'testName' );  // orig YUI Test err msg: "getName() not properly retriving Attribute's name. Was looking for 'testName'."
				
				var attribute2 = new ConcreteAttribute( { name: '_' } );
				expect( attribute2.getName() ).toBe( '_' );  // orig YUI Test err msg: "getName() not properly retriving Attribute's name. Was looking for '_'."
				
				var attribute3 = new ConcreteAttribute( { name: "abc" } );
				expect( attribute3.getName() ).toBe( "abc" );  // orig YUI Test err msg: "getName() not properly retriving Attribute's name. Was looking for 'abc'."
			} );
			
			
			it( "Providing the attribute name as a number directly to the constructor argument should be converted to a string for the attribute's name", function() {
				var attribute = new ConcreteAttribute( 0 );
				expect( attribute.getName() ).toBe( "0" );  // orig YUI Test err msg: "the attribute name should have been converted to a string"
			} );
			
			
			it( "Providing the attribute name as a property on the config should be converted to a string for the attribute's name", function() {
				var attribute = new ConcreteAttribute( {
					name : 0
				} );
				expect( attribute.getName() ).toBe( "0" );  // orig YUI Test err msg: "the attribute name should have been converted to a string"
			} );
			
		} );
		
		
		describe( 'hasUserDefinedSetter()', function() {			
			
			it( "hasUserDefinedSetter() should return false when there is no user-defined setter", function() {
				var attribute = new ConcreteAttribute( {
					name : 'myAttr'
				} );
				
				expect( attribute.hasUserDefinedSetter() ).toBe( false );
			} );
			
			
			it( "hasUserDefinedSetter() should return true when there is a user-defined setter", function() {
				var attribute = new ConcreteAttribute( {
					name : 'myAttr',
					set : function( v ) { return v; }
				} );
				
				expect( attribute.hasUserDefinedSetter() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'hasUserDefinedGetter()', function() {			
			
			it( "hasUserDefinedGetter() should return false when there is no user-defined getter", function() {
				var attribute = new ConcreteAttribute( {
					name : 'myAttr'
				} );
				
				expect( attribute.hasUserDefinedGetter() ).toBe( false );
			} );
			
			
			it( "hasUserDefinedGetter() should return true when there is a user-defined getter", function() {
				var attribute = new ConcreteAttribute( {
					name : 'myAttr',
					get : function( v ) { return v; }
				} );
				
				expect( attribute.hasUserDefinedGetter() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'getDefaultValue()', function() {			
			
			it( "should return the value of the `defaultValue` config", function() {
				var attribute = new ConcreteAttribute( {
					name : "TestAttribute",
					defaultValue : 1
				} );
				
				expect( attribute.getDefaultValue() ).toBe( 1 );
			} );
			
			
			it( "should execute the factory function provided as the `defaultValue`, returning the factory's return value", function() {
				var attribute = new ConcreteAttribute( {
					name : "TestAttribute",
					
					defaultValue : function() {
						// Make sure this function is called in the scope of the Attribute, even though it's provided as a config option
						expect( this ).toBe( attribute );
						
						return 1; 
					}
				} );
				
				expect( attribute.getDefaultValue() ).toBe( 1 );
			} );
			
			
			it( "A default provided as defaultValue that is a function should be executed each time the default is called for", function() {
				var counter = 0;
				var attribute = new ConcreteAttribute( {
					name : "TestAttribute",
					defaultValue : function() { return ++counter; }
				} );
				
				expect( attribute.getDefaultValue() ).toBe( 1 );
				expect( attribute.getDefaultValue() ).toBe( 2 );
			} );
			
			
			it( "should make a deep clone of the `defaultValue` if it is an object, so that modifying the properties do not affect the original", function() {
				var origDefaultValue = {
					a : 1,
					b : 2,
					c : {
						d : 3
					}
				};
				
				var attribute = new ConcreteAttribute( {
					name : "TestAttribute",
					defaultValue : origDefaultValue
				} );
				
				var defaultValue = attribute.getDefaultValue();
				expect( defaultValue ).not.toBe( origDefaultValue );  // should *not* be the same object
				
				defaultValue.c.d = 99;
				expect( origDefaultValue.c.d ).toBe( 3 );  // make sure the deep object in the original was not modified
			} );
			
		} );
		
		
		describe( 'doSet()', function() {
			
			it( "should call the Attribute's prototype set() method if there is no 'set' config, with the appropriate arguments", function() {
				var mockModel = JsMockito.mock( Model ),
				    newValue = 42,
				    oldValue = 27;
				
				var providedModel, 
				    providedNewValue, 
				    providedOldValue;
				    
				var ConcreteAttribute = Attribute.extend( {
					set : function( model, newValue, oldValue ) {
						providedModel = model;
						providedNewValue = newValue;
						providedOldValue = oldValue;
					}
				} );
				
				var attribute = new ConcreteAttribute( 'attr' );
				attribute.doSet( mockModel, newValue, oldValue );
				
				expect( providedModel ).toBe( mockModel );  // orig YUI Test err msg: "The mock model should have been provided as the first arg to the set() method"
				expect( providedNewValue ).toBe( newValue );  // orig YUI Test err msg: "The new value should have been provided as the second arg to the set() method"
				expect( providedOldValue ).toBe( oldValue );  // orig YUI Test err msg: "The old value should have been provided as the third arg to the set() method"
			} );
			
			
			it( "should call a provided 'set' config function if provided to the Attribute, and it should be called in the scope of the model", function() {
				var mockModel = JsMockito.mock( Model ),
				    newValue = 42,
				    oldValue = 27;
				
				var contextCalledIn, 
				    providedNewValue, 
				    providedOldValue;
				    
				var ConcreteAttribute = Attribute.extend( {} );
				
				var attribute = new ConcreteAttribute( {
					name: 'attr',
					set: function( newValue, oldValue ) {
						contextCalledIn = this;
						providedNewValue = newValue;
						providedOldValue = oldValue;
					}
				} );
				
				attribute.doSet( mockModel, newValue, oldValue );
				
				expect( contextCalledIn ).toBe( mockModel );  // orig YUI Test err msg: "The 'set' config should have been called in the context of the mock model"
				expect( providedNewValue ).toBe( newValue );  // orig YUI Test err msg: "The new value should have been provided as the first arg to the set() method"
				expect( providedOldValue ).toBe( oldValue );  // orig YUI Test err msg: "The old value should have been provided as the second arg to the set() method"
			} );
			
		} );
		
	} );
} );