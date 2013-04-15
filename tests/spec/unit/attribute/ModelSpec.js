/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
/*jshint browser:true */
define( [
	'data/attribute/Model',
	'data/Model'
], function( ModelAttribute, Model ) {
		
	describe( "unit.attribute.Model", function() {
		
		describe( "Test constructor", function() {
			
			it( "the constructor should throw an error if the undefined value is provided for the `model` config, which helps determine when late binding is needed for the `model` config", function() {
				expect( function() {
					var attr = new ModelAttribute( {
						name : 'attr',
						model: undefined
					} );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The constructor should have thrown an error if the `model` config was provided but was undefined. This is to help with debugging when late binding for the `model` subclass is needed."
				} ).toThrow( "The `model` config provided to a Model Attribute with the name 'attr' either doesn't exist, or doesn't exist just yet. Consider using the String or Function form of the `model` config for late binding, if needed." );
			} );
			
		} );
		
		
		describe( "Test valuesAreEqual()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.attribute = new ModelAttribute( { name: 'attr' } );
			} );
			
			
			it( "valuesAreEqual() should return true for two null values", function() {
				var result = thisSuite.attribute.valuesAreEqual( null, null );
				expect( result ).toBe( true );
			} );
			
			
			it( "valuesAreEqual() should return false for one null and one object", function() {
				var result;
				
				result = thisSuite.attribute.valuesAreEqual( null, {} );
				expect( result ).toBe( false );
				
				result = thisSuite.attribute.valuesAreEqual( {}, null );
				expect( result ).toBe( false );
			} );
			
			
			it( "valuesAreEqual() should return true for comparing the same model", function() {
				var MyModel = Model.extend( {
					attributes : [ 'id' ]
				} );
				
				// NOTE: These should refer to the same object, as only one Model will be instantiated for two Models with the same ID 
				var model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 1 } );
				
				var result = thisSuite.attribute.valuesAreEqual( model1, model2 );
				expect( result ).toBe( true );
			} );
			
			
			it( "valuesAreEqual() should return false for two different models", function() {
				var MyModel = Model.extend( {
					attributes : [ 'id' ]
				} );
				
				var model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 2 } );
				
				var result = thisSuite.attribute.valuesAreEqual( model1, model2 );
				expect( result ).toBe( false );
			} );
			
		} );
		
		
		describe( "Test beforeSet()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'attr1', 'attr2' ]
				} );
				
				thisSuite.attribute = new ModelAttribute( { 
					name: 'attr',
					model: thisSuite.Model
				} );
			} );
			
			
			it( "beforeSet() should return null when provided any falsy value, or non-object", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new ModelAttribute( { name: 'attr' } ),
				    oldValue,  // undefined
				    value;
				
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( null );
			} );
			
			
			it( "beforeSet() should throw an error if the string `model` config does not reference a Model class", function() {
				expect( function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new ModelAttribute( { 
						name: 'attr',
						model: 'somethingThatIsNotDefined'
					} );
					
					var data = { attr1: 1, attr2: 2 },
					    value = attribute.beforeSet( mockModel, data, oldValue );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have thrown an error in the call to attribute.beforeSet()"
				} ).toThrow( "The string value `model` config did not resolve to a Model subclass for attribute 'attr'" );
			} );
			
			
			it( "beforeSet() should throw an error if the function value `model` config does not reference a Model class", function() {
				expect( function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new ModelAttribute( { 
						name: 'attr',
						model: function() {
							return;  // undefined
						}
					} );
					
					var data = { attr1: 1, attr2: 2 },
					    value = attribute.beforeSet( mockModel, data, oldValue );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have thrown an error in the call to attribute.beforeSet()"
				} ).toThrow( "The function value `model` config did not resolve to a Model subclass for attribute 'attr'" );
			} );
			
			
			it( "beforeSet() should convert an anonymous data object to the provided `model`, when `model` is a direct reference to the Model subclass", function() {
				var mockModel = JsMockito.mock( Model ),
				    data = { attr1: 1, attr2: 2 },
				    oldValue,  // undefined
				    value = thisSuite.attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value instanceof thisSuite.Model ).toBe( true );  // orig YUI Test err msg: "The return value from beforeSet should have been an instance of the Model"
				expect( value.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should have been set to the new model"
				expect( value.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should have been set to the new model"
			} );
			
			
			it( "beforeSet() should convert an anonymous data object to the provided `model` subclass, when the `model` config is a string", function() {
				// Use a deeply nested namespace, as that will probably be what is used
				window.__Data_CollectionAttributeTest = {};
				window.__Data_CollectionAttributeTest.ns1 = {};
				window.__Data_CollectionAttributeTest.ns1.ns2 = {};
				window.__Data_CollectionAttributeTest.ns1.ns2.MyModel = Model.extend( {
					attributes : [ 'attr1', 'attr2' ]
				} );
				
				var mockModel = JsMockito.mock( Model ),
				    oldValue;  // undefined
				
				var attribute = new ModelAttribute( { 
					name: 'attr',
					model: '__Data_CollectionAttributeTest.ns1.ns2.MyModel'
				} );
				
				var data = { attr1: 1, attr2: 2 };
				var value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value instanceof window.__Data_CollectionAttributeTest.ns1.ns2.MyModel ).toBe( true );  // orig YUI Test err msg: "The return value from beforeSet should have been an instance of the Model"
				expect( value.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should have been set to the new model"
				expect( value.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should have been set to the new model"
				
				delete window.__Data_CollectionAttributeTest;
			} );
			
			
			it( "beforeSet() should convert an anonymous data object to the provided `model` subclass, when the `model` config is a function", function() {
				var TestModel = Model.extend( {
					attributes : [ 'attr1', 'attr2' ]
				} );
				
				var mockModel = JsMockito.mock( Model ),
				    oldValue;  // undefined
				
				var attribute = new ModelAttribute( { 
					name: 'attr',
					model: function() {
						return TestModel;   // for late binding
					}
				} );
				
				var data = { attr1: 1, attr2: 2 };
				var value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value instanceof TestModel ).toBe( true );  // orig YUI Test err msg: "The return value from beforeSet should have been an instance of the Model"
				expect( value.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should have been set to the new model"
				expect( value.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should have been set to the new model"
			} );
			
			
			it( "beforeSet() should return an actual Model instance unchanged", function() {
				var mockModel = JsMockito.mock( Model ),
				    oldValue,  // undefined
				    data = new thisSuite.Model( { attr1 : 1, attr2: 2 } ),
				    value = thisSuite.attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value ).toBe( data );  // orig YUI Test err msg: "The return value from beforeSet should have been the same model instance"
				expect( value.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should remain set to the new model"
				expect( value.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should remain set to the new model"
			} );
			
			
			it( "if no `model` config was provided, beforeSet() should return an anonymous data object unchanged, to allow a user-defined set() method to take care of it", function() {
				var mockModel = JsMockito.mock( Model ),
				    oldValue;
				
				var attribute = new ModelAttribute( { 
					name: 'attr'
				} );
				
				var data = { attr1: 1, attr2: 2 };
				var value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value ).toBe( data );
			} );
			
		} );
		
		
		describe( "Test afterSet()", function() {
			
			it( "afterSet() should return the model (i.e. it doesn't forget the return statement!)", function() {
				var mockModel = JsMockito.mock( Model );
				
				var attribute = new ModelAttribute( { 
					name: 'attr'
				} );
				
				var value = attribute.afterSet( mockModel, mockModel );  // just pass itself for the value, doesn't matter
				expect( value ).toBe( mockModel );
			} );
			
		} );
		
	} );
} );