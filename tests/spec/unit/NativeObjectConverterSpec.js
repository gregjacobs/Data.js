/*global define, _, describe, beforeEach, afterEach, it, expect */
define( [
	'jquery',
	'lodash',
	'data/NativeObjectConverter',
	'data/Model',
	'data/Collection'
], function( jQuery, _, NativeObjectConverter, Model, Collection ) {

	describe( "data.NativeObjectConverter", function() {
		
		describe( "Test convert() with a model", function() {
			
			it( "convert() should return a key for each of the Attributes in the Model, whether or not any data has been set to them", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attribute1', 'attribute2' ]
				} );
				var model = new MyModel( { attribute1: 'value1' } );
				
				var data = NativeObjectConverter.convert( model );
				expect( data.hasOwnProperty( 'attribute1' ) ).toBe( true );  // orig YUI Test err msg: "The data returned should have attribute1"
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.hasOwnProperty( 'attribute2' ) ).toBe( true );  // orig YUI Test err msg: "The data returned should have attribute2, even though no value has been set to it"
				expect( _.isUndefined( data.attribute2 ) ).toBe( true );  // orig YUI Test err msg: "attribute2 should be undefined in the returned data"
			} );
			
			
			it( "convert() should return the data by running attributes' `get` functions (not just returning the raw data), when the `raw` option is not provided", function() {
				var MyModel = Model.extend( {
					attributes : [ 
						'attribute1', 
						{ name: 'attribute2', get: function( model, valuel ) { return "42 " + model.get( 'attribute1' ); } }
					]
				} );
				var model = new MyModel( { attribute1: 'value1', attribute2: 'value2' } );
				
				var data = NativeObjectConverter.convert( model );
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.attribute2 ).toBe( '42 value1' );  // orig YUI Test err msg: "attribute2 should have had its `get` function run, and that used as the value in the data"
			} );
			
			
			it( "when the `raw` option is provided as true, convert() should return the data by running attributes' `raw` functions (not using `get`)", function() {
				var MyModel = Model.extend( {
					attributes : [ 
						'attribute1', 
						{ name: 'attribute2', get: function( model, value ) { return "42 " + model.get( 'attribute1' ); } },
						{ name: 'attribute3', raw: function( model, value ) { return value + " " + model.get( 'attribute1' ); } }
					]
				} );
				var model = new MyModel( { attribute1: 'value1', attribute2: 'value2', attribute3: 'value3' } );
				
				var data = NativeObjectConverter.convert( model, { raw: true } );
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.attribute2 ).toBe( 'value2' );  // orig YUI Test err msg: "attribute2 should NOT have had its `get` function run. Its underlying data should have been returned"
				expect( data.attribute3 ).toBe( 'value3 value1' );  // orig YUI Test err msg: "attribute3 should have had its `raw` function run, and that value returned"
			} );
			
			
			it( "convert() should only retrieve the data for the persisted attributes (i.e. attributes with persist: true) with the `persistedOnly` option set to true", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name : 'attribute1', persist: true },
						{ name : 'attribute2', persist: false },
						{ name : 'attribute3', persist: true },
						{ name : 'attribute4', persist: false }
					]
				} );
				
				var model = new MyModel();
				
				var persistedData = NativeObjectConverter.convert( model, { persistedOnly: true } );
				expect( _.keys( persistedData ).length ).toBe( 2 );  // orig YUI Test err msg: "The persisted data should only have 2 properties"
				expect( persistedData.hasOwnProperty( 'attribute1' ) ).toBe( true );expect( persistedData.hasOwnProperty( 'attribute3' ) ).toBe( true );  // orig YUI Test err msg: "The persisted data should have 'attribute1' and 'attribute3'"
			} );
			
			
			it( "convert() should only retrieve the data for the persisted attributes in nested models (i.e. attributes with persist: true) with the `persistedOnly` option set to true", function() {
				var ParentModel = Model.extend( {
					attributes : [
						{ name: 'id', type: 'string' },
						{ name: 'child', type: 'model', embedded: true }
					]
				} );
				
				var ChildModel = Model.extend( {
					attributes : [
						{ name : 'persistedAttr', type: 'string' },
						{ name : 'unpersistedAttr', type: 'string', persist: false }
					]
				} );
				
				var childModel = new ChildModel( {
					persistedAttr: 'persisted',
					unpersistedAttr: 'unpersisted'
				} );
				var parentModel = new ParentModel( {
					id: 1,
					child: childModel
				} );
				childModel.set( 'unpersistedAttr', 'newValue' );
				
				
				var persistedData = NativeObjectConverter.convert( parentModel, { persistedOnly: true } );
				expect( persistedData.hasOwnProperty( 'id' ) ).toBe( true );expect( persistedData.hasOwnProperty( 'child' ) ).toBe( true );  // orig YUI Test err msg: "The persisted data for the parent model should have 'id' and 'child' attributes"
				
				var childAttrs = persistedData.child;
				expect( _.keys( childAttrs ).length ).toBe( 1 );  // orig YUI Test err msg: "The child data shoud only have 1 property in the data (the persisted one)"
				expect( childAttrs.hasOwnProperty( 'persistedAttr' ) ).toBe( true );  // orig YUI Test err msg: "The child data should only have the 'persistedAttr' attribute"
			} );
			
			
			it( "convert() should only process the attributes of a Model that are defined by the 'attributeNames' option (if provided)", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name : 'attribute1', persist: true },
						{ name : 'attribute2', persist: false },
						{ name : 'attribute3', persist: true },
						{ name : 'attribute4', persist: false }
					]
				} );
				
				var model = new MyModel();
				
				var data = NativeObjectConverter.convert( model, { attributeNames: [ 'attribute1', 'attribute3' ] } );
				expect( _.keys( data ).length ).toBe( 2 );  // orig YUI Test err msg: "The data should only have 2 properties"
				expect( data.hasOwnProperty( 'attribute1' ) ).toBe( true );expect( data.hasOwnProperty( 'attribute3' ) ).toBe( true );  // orig YUI Test err msg: "The data should only have 'attribute1' and 'attribute3'"
			} );
			
			
			it( "Using the 'attributeNames' option should only affect the Model that is provided to convert(), not nested models", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attribute1', 'attribute2' ]
				} );
				
				var model = new MyModel( {
					attribute1: new MyModel( {  // nested model
						attribute1: 'innerValue1',
						attribute2: 'innerValue2'
					} ),
					attribute2: 'value2'
				} );
				
				var data = NativeObjectConverter.convert( model, { attributeNames: [ 'attribute1' ] } );
				
				// Check the outer object -- the conversion of `model`
				expect( _.keys( data ).length ).toBe( 1 );  // orig YUI Test err msg: "The data should only have 1 property"
				expect( data.hasOwnProperty( 'attribute1' ) ).toBe( true );  // orig YUI Test err msg: "attribute1 should exist on the return data"
				
				// Check the inner object -- the conversion of the nested model
				var innerData = data.attribute1;
				expect( _.keys( innerData ).length ).toBe( 2 );  // orig YUI Test err msg: "The inner (nested) data should have 2 properties"
				expect( innerData.attribute1 ).toBe( 'innerValue1' );  // orig YUI Test err msg: "The inner (nested) attribute1 should have the correct value"
				expect( innerData.attribute2 ).toBe( 'innerValue2' );  // orig YUI Test err msg: "The inner (nested) attribute2 should have the correct value"
			} );
			
			
			it( "convert() should deep convert nested models, while handing circular references", function() {
				var MyModel = Model.extend( {
					attributes : [ 'value', 'relatedModel' ]
				} );
				
				var outerModel = new MyModel(),
				    innerModel = new MyModel();
				
				// Set up the outerModel to refer to the innerModel, and the innerModel to refer to the outerModel
				outerModel.set( 'value', 'outerModel-value' );
				outerModel.set( 'relatedModel', innerModel );
				
				innerModel.set( 'value', 'innerModel-value' );
				innerModel.set( 'relatedModel', outerModel );
				
				
				var data = NativeObjectConverter.convert( outerModel );
				expect( _.keys( data ).length ).toBe( 2 );  // orig YUI Test err msg: "The outerModel data should only have 2 properties"
				
				// Check that references to other models were set up correctly
				expect( data.relatedModel.value ).toBe( 'innerModel-value' );  // orig YUI Test err msg: "Should be able to access the inner model's value from the outer model."
				expect( data.relatedModel.relatedModel.value ).toBe( 'outerModel-value' );  // orig YUI Test err msg: "Should be able to access the outer model's value from the inner model"
				expect( data.relatedModel.relatedModel.relatedModel.value ).toBe( 'innerModel-value' );  // orig YUI Test err msg: "Should be able to go around and around, just to make sure we have the circular dependency handled"
				
				// Make sure that the data object for the outer model, when referenced from the inner model, points back to the `data` 
				// variable that is returned by the convert() method
				expect( data.relatedModel.relatedModel ).toBe( data );  // orig YUI Test err msg: "The outer -> inner -> outer should point to the `data` object returned by the convert() method, as that is the model that was converted" 
				
				// Make sure that references really do point to the same object
				expect( data.relatedModel.relatedModel.relatedModel.relatedModel ).toBe( data.relatedModel.relatedModel );  // orig YUI Test err msg: "The outer -> inner -> outer should point to the outer reference"
			} );
			
		} );
		
		
		describe( "Test convert() with a Collection", function() {
			
			it( "convert() should convert a Collection of Models into an Array of Objects", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attr1', 'attr2' ]
				} );
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var collection = new MyCollection( [ { attr1: 1, attr2: 2 }, { attr1: 3, attr2: 4 } ] );
				var data = NativeObjectConverter.convert( collection );
				
				expect( _.isArray( data ) ).toBe( true );  // orig YUI Test err msg: "the data should be an array"
				expect( data.length ).toBe( 2 );  // orig YUI Test err msg: "There should be 2 items in the array"
				expect( data[ 0 ].attr1 ).toBe( 1 );  // orig YUI Test err msg: "The first array item's attr1 should be 1"
				expect( data[ 0 ].attr2 ).toBe( 2 );  // orig YUI Test err msg: "The first array item's attr2 should be 2"
				expect( data[ 1 ].attr1 ).toBe( 3 );  // orig YUI Test err msg: "The second array item's attr1 should be 3"
				expect( data[ 1 ].attr2 ).toBe( 4 );  // orig YUI Test err msg: "The second array item's attr2 should be 4"
			} );
			
			
			it( "convert() should deep convert nested models/collections, while handing circular references", function() {
				var MyModel = Model.extend( {
					attributes : [ 'nestedCollection' ]
				} );
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var model = new MyModel();
				var collection = new MyCollection();
				
				// Set up the model to hold the collection, while the collection holds the model
				model.set( 'nestedCollection', collection );
				collection.add( model );
				
				var data = NativeObjectConverter.convert( collection );
				
				expect( _.isArray( data ) ).toBe( true );  // orig YUI Test err msg: "the data should be an array"
				expect( data.length ).toBe( 1 );  // orig YUI Test err msg: "There should be 1 item in the array"
				expect( _.isObject( data[ 0 ] ) ).toBe( true );  // orig YUI Test err msg: "The data's first element should be an object"
				expect( _.isArray( data[ 0 ].nestedCollection ) ).toBe( true );  // orig YUI Test err msg: "The data's first element's nestedCollection should be an array"
				expect( data[ 0 ].nestedCollection ).toBe( data );  // orig YUI Test err msg: "The nested collection's array should refer back to the same array created for 'data'"
				
				// Make sure we can reference through the nested collections
				expect( data[ 0 ].nestedCollection[ 0 ].nestedCollection[ 0 ].nestedCollection ).toBe( data );  // orig YUI Test err msg: "Nesty nesty nesty should work"
			} );
			
			
			it( "convert() should simply return an array of objects with only an id property for each of the models in a Collection if 'raw' is true and the collection is not 'embedded'", function() {
				var MyModel = Model.extend( {
					attributes : [ 
						{ name: 'nestedCollection', type: 'collection', embedded: false } 
					]
				} );
				var ChildModel = Model.extend( {
					attributes : [
						{ name: 'id' },
						{ name: 'attr' }
					]
				} );
				var MyCollection = Collection.extend( {
					model : ChildModel
				} );
				
				
				var collection = new MyCollection( [
					{ id: 1, attr: 'attr1' },
					{ id: 2, attr: 'attr2' }
				] );
				var parentModel = new MyModel( {
					nestedCollection: collection
				} );
				
				var data = NativeObjectConverter.convert( parentModel, { raw: true } );
				
				expect( _.isObject( data ) ).toBe( true );  // orig YUI Test err msg: "the data should be an object"
				expect( _.isArray( data.nestedCollection ) ).toBe( true );  // orig YUI Test err msg: "The data returned should have nestedCollection as an array"
				
				expect( _.isObject( data.nestedCollection[ 0 ] ) ).toBe( true );  // orig YUI Test err msg: "The first item in the array should be an object"
				expect( data.nestedCollection[ 0 ].id ).toBe( 1 );  // orig YUI Test err msg: "The first item in the array should have the correct id"
				expect( data.nestedCollection[ 0 ].hasOwnProperty( 'attr' ) ).toBe( false );  // orig YUI Test err msg: "The 'attr' property should *not* exist in the object in the first item of the array"
				
				expect( _.isObject( data.nestedCollection[ 1 ] ) ).toBe( true );  // orig YUI Test err msg: "The second item in the array should be an object"
				expect( data.nestedCollection[ 1 ].id ).toBe( 2 );  // orig YUI Test err msg: "The second item in the array should have the correct id"
				expect( data.nestedCollection[ 1 ].hasOwnProperty( 'attr' ) ).toBe( false );  // orig YUI Test err msg: "The 'attr' property should *not* exist in the object in the second item of the array"
			} );
			
		} );
		
	} );
	
} );