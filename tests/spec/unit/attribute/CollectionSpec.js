/*global define, window, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/Collection',
	'data/attribute/Collection'
], function( Model, Collection, CollectionAttribute ) {
	
	describe( "unit.attribute.data.attribute.Collection", function() {
		
		describe( "Test constructor", function() {
			
			it( "the constructor should throw an error if the undefined value is provided for the `collection` config, which helps determine when late binding is needed for the `collection` config", function() {
				expect( function() {
					var attr = new CollectionAttribute( {
						name : 'attr',
						collection: undefined
					} );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The constructor should have thrown an error if the `collection` config was provided but was undefined. This is to help with debugging when late binding for the `collection` is needed."
				} ).toThrow( "The `collection` config provided to a Collection Attribute with the name 'attr' either doesn't exist, or doesn't exist just yet. Consider using the String or Function form of the `collection` config for late binding, if needed." );
			} );
			
		} );
		
		
		describe( "Test valuesAreEqual()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.attribute = new CollectionAttribute( { name: 'attr' } );
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
			
			
			it( "valuesAreEqual() should return true for comparing the same collection", function() {
				var MyCollection = Collection.extend( {} ),
				    collection = new MyCollection();
				
				var result = thisSuite.attribute.valuesAreEqual( collection, collection );
				expect( result ).toBe( true );
			} );
			
			
			it( "valuesAreEqual() should return false for two different collections", function() {
				var MyCollection = Collection.extend( {} ),
				    collection1 = new MyCollection(),
				    collection2 = new MyCollection();
				
				var result = thisSuite.attribute.valuesAreEqual( collection1, collection2 );
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
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
				
				thisSuite.attribute = new CollectionAttribute( { 
					name: 'attr',
					collection: thisSuite.Collection
				} );
			} );
			
			
			it( "beforeSet() should return null when provided any falsy value, or non-object", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new CollectionAttribute( { name: 'attr' } ),
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
			
			
			it( "beforeSet() should throw an error if the string `collection` config does not reference a Collection subclass", function() {
				expect( function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new CollectionAttribute( { 
						name: 'attr',
						collection: 'somethingThatIsNotDefined'
					} );
					
					var data = [ { attr1: 1, attr2: 2 }, { attr1: 3, attr2: 4 } ],
					    value = attribute.beforeSet( mockModel, data, oldValue );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have thrown an error in the call to attribute.beforeSet()"
				} ).toThrow( "The string value `collection` config did not resolve to a Collection subclass for attribute 'attr'" );
			} );
			
			
			it( "beforeSet() should throw an error if the function value `collection` config does not reference a Collection subclass", function() {
				expect( function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new CollectionAttribute( { 
						name: 'attr',
						collection: function() {
							return;  // undefined
						}
					} );
					
					var data = [ { attr1: 1, attr2: 2 }, { attr1: 3, attr2: 4 } ],
					    value = attribute.beforeSet( mockModel, data, oldValue );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have thrown an error in the call to attribute.beforeSet()"
				} ).toThrow( "The function value `collection` config did not resolve to a Collection subclass for attribute 'attr'" );
			} );
			
			
			it( "beforeSet() should convert an array of data objects, when the `collection` config is a direct reference to the Collection subclass", function() {
				var mockModel = JsMockito.mock( Model ),
				    data = [ { attr1: 1, attr2: 2 }, { attr1: 3, attr2: 4 } ],
				    oldValue,  // undefined
				    value = thisSuite.attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value instanceof thisSuite.Collection ).toBe( true );  // orig YUI Test err msg: "The return value from beforeSet should have been an instance of the Collection"
				
				var model1 = value.getAt( 0 ),
				    model2 = value.getAt( 1 );
				expect( model1.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model1.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model2.get( 'attr1' ) ).toBe( 3 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model2.get( 'attr2' ) ).toBe( 4 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
			} );
			
			
			it( "beforeSet() should convert an array of data objects, when the `collection` config is a string", function() {
				// Use a deeply nested namespace, as that will probably be what is used
				window.__Data_CollectionAttributeTest = {};
				window.__Data_CollectionAttributeTest.ns1 = {};
				window.__Data_CollectionAttributeTest.ns1.ns2 = {};
				window.__Data_CollectionAttributeTest.ns1.ns2.MyCollection = Collection.extend( {
					model : thisSuite.Model
				} );
				
				var mockModel = JsMockito.mock( Model ),
				    oldValue;  // undefined
				
				var attribute = new CollectionAttribute( { 
					name: 'attr',
					collection: '__Data_CollectionAttributeTest.ns1.ns2.MyCollection'
				} );
				
				var data = [ { attr1: 1, attr2: 2 }, { attr1: 3, attr2: 4 } ],
				    value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value instanceof window.__Data_CollectionAttributeTest.ns1.ns2.MyCollection ).toBe( true );  // orig YUI Test err msg: "The return value from beforeSet should have been an instance of the Collection"
				
				
				var model1 = value.getAt( 0 ),
				    model2 = value.getAt( 1 );
				expect( model1.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model1.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model2.get( 'attr1' ) ).toBe( 3 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model2.get( 'attr2' ) ).toBe( 4 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				
				delete window.__Data_CollectionAttributeTest;
			} );
			
			
			it( "beforeSet() should convert an array of data objects, when the `collection` config is a function", function() {
				var TestCollection = Collection.extend( {
					model : thisSuite.Model
				} );
				
				var mockModel = JsMockito.mock( Model ),
				    oldValue;  // undefined
				
				var attribute = new CollectionAttribute( { 
					name: 'attr',
					collection: function() {
						return TestCollection;   // for late binding
					}
				} );
				
				var data = [ { attr1: 1, attr2: 2 }, { attr1: 3, attr2: 4 } ],
				    value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value instanceof TestCollection ).toBe( true );  // orig YUI Test err msg: "The return value from beforeSet should have been an instance of the Collection"
				
				var model1 = value.getAt( 0 ),
				    model2 = value.getAt( 1 );
				expect( model1.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model1.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model2.get( 'attr1' ) ).toBe( 3 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
				expect( model2.get( 'attr2' ) ).toBe( 4 );  // orig YUI Test err msg: "The data should have been converted to a model in the collection"
			} );
			
			
			it( "beforeSet() should return an actual Collection instance unchanged", function() {
				var mockModel = JsMockito.mock( Model ),
				    oldValue,  // undefined
				    data = new thisSuite.Collection( [ { attr1 : 1, attr2: 2 } ] ),
				    value = thisSuite.attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value ).toBe( data );  // orig YUI Test err msg: "The return value from beforeSet should have been the same collection instance"
				
				var model = value.getAt( 0 );
				expect( model.get( 'attr1' ) ).toBe( 1 );  // orig YUI Test err msg: "The data should remain set to the new model"
				expect( model.get( 'attr2' ) ).toBe( 2 );  // orig YUI Test err msg: "The data should remain set to the new model"
			} );
			
			
			it( "if no `collection` config was provided, beforeSet() should return an array unchanged, to allow a user-defined set() method to take care of it", function() {
				var mockModel = JsMockito.mock( Model ),
				    oldValue;
				
				var attribute = new CollectionAttribute( { 
					name: 'attr'
				} );
				
				var data = [ { attr1: 1, attr2: 2 } ],
				    value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value ).toBe( data );
			} );
			
		} );
		
		
		describe( "Test afterSet()", function() {
			
			it( "afterSet() should return the collection (i.e. it doesn't forget the return statement!)", function() {
				var mockModel = JsMockito.mock( Model ),
				    mockCollection = JsMockito.mock( Collection );
				
				var attribute = new CollectionAttribute( { 
					name: 'attr'
				} );
				
				var value = attribute.afterSet( mockModel, mockCollection );
				expect( value ).toBe( mockCollection );
			} );
			
		} );
		
	} );
} );