/*global define, window, describe, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	'data/Model'
], function( _, Model ) {
		
	describe( "Integration: Model with NativeObjectConverter", function() {
		
		describe( "Test getData()", function() {
			
			it( "Model::getData() should return a key for each of the Attributes in the Model, whether or not any data has been set to them", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attribute1', 'attribute2' ]
				} );
				var model = new MyModel( { attribute1: 'value1' } );
				
				var data = model.getData();
				expect( data.hasOwnProperty( 'attribute1' ) ).toBe( true );  // orig YUI Test err msg: "The data returned should have attribute1"
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.hasOwnProperty( 'attribute2' ) ).toBe( true );  // orig YUI Test err msg: "The data returned should have attribute2, even though no value has been set to it"
				expect( _.isUndefined( data.attribute2 ) ).toBe( true );  // orig YUI Test err msg: "attribute2 should be undefined in the returned data"
			} );
			
			
			it( "Model::getData() should return the data by running attributes' `get` functions (not just returning the raw data), when the `raw` option is not provided", function() {
				var MyModel = Model.extend( {
					attributes : [ 
						'attribute1', 
						{ name: 'attribute2', get: function( model, value ) { return "42 " + model.get( 'attribute1' ); } }
					]
				} );
				var model = new MyModel( { attribute1: 'value1', attribute2: 'value2' } );
				
				var data = model.getData();
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.attribute2 ).toBe( '42 value1' );  // orig YUI Test err msg: "attribute2 should have had its `get` function run, and that used as the value in the data"
			} );
			
			
			it( "when the `raw` option is provided as true, Model::getData() should return the data by running attributes' `raw` functions (not using `get`)", function() {
				var MyModel = Model.extend( {
					attributes : [ 
						'attribute1', 
						{ name: 'attribute2', get: function( model, value ) { return "42 " + model.get( 'attribute1' ); } },
						{ name: 'attribute3', raw: function( model, value ) { return value + " " + model.get( 'attribute1' ); } }
					]
				} );
				var model = new MyModel( { attribute1: 'value1', attribute2: 'value2', attribute3: 'value3' } );
				
				var data = model.getData( { raw: true } );
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.attribute2 ).toBe( 'value2' );  // orig YUI Test err msg: "attribute2 should NOT have had its `get` function run. Its underlying data should have been returned"
				expect( data.attribute3 ).toBe( 'value3 value1' );  // orig YUI Test err msg: "attribute3 should have had its `raw` function run, and that value returned"
			} );
			
			
			it( "Model::getData() should only retrieve the data for the persisted attributes (i.e. attributes with persist: true) with the `persistedOnly` option set to true", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name : 'attribute1', persist: true },
						{ name : 'attribute2', persist: false },
						{ name : 'attribute3', persist: true },
						{ name : 'attribute4', persist: false }
					]
				} );
				
				var model = new MyModel();
				
				var persistedData = model.getData( { persistedOnly: true } );
				expect( _.keys( persistedData ).length ).toBe( 2 );  // orig YUI Test err msg: "The persisted data should only have 2 properties"
				expect( persistedData.hasOwnProperty( 'attribute1' ) ).toBe( true );expect( persistedData.hasOwnProperty( 'attribute3' ) ).toBe( true );  // orig YUI Test err msg: "The persisted data should have 'attribute1' and 'attribute3'"
			} );
			
		} );
		
		
		describe( "Test getChanges()", function() {
			
			it( "Model::getChanges() should return a single attribute that has had its value changed", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attribute1', 'attribute2' ]
				} );
				var model = new MyModel();
				model.set( 'attribute1', "new value" );
				
				var changes = model.getChanges();
				expect( _.keys( changes ).length ).toBe( 1 );  // orig YUI Test err msg: "The changes hash retrieved should have exactly 1 property"
				expect( changes.attribute1 ).toBe( "new value" );  // orig YUI Test err msg: "The change to attribute1 should have been 'new value'."
			} );
			
			
			it( "Model::getChanges() should return multiple attributes that have had their values changed", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attribute1', 'attribute2' ]
				} );
				var model = new MyModel();
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				
				var changes = model.getChanges();
				expect( _.keys( changes ).length ).toBe( 2 );  // orig YUI Test err msg: "The changes hash retrieved should have exactly 2 properties"
				expect( changes.attribute1 ).toBe( "new value 1" );  // orig YUI Test err msg: "The change to attribute1 should have been 'new value 1'."
				expect( changes.attribute2 ).toBe( "new value 2" );  // orig YUI Test err msg: "The change to attribute2 should have been 'new value 2'."
			} );
			
			
			it( "Model::getChanges() should return the data by running attributes' `get` functions (not just returning the raw data)", function() {
				var MyModel = Model.extend( {
					attributes : [ 
						'attribute1', 
						{ name: 'attribute2', get: function( model, value ) { return "42 " + model.get( 'attribute1' ); } },
						'attribute3'
					]
				} );
				var model = new MyModel();
				model.set( 'attribute1', 'value1' );
				model.set( 'attribute2', 'value2' ); 
				
				var data = model.getChanges();
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.attribute2 ).toBe( '42 value1' );  // orig YUI Test err msg: "attribute2 should have had its `get` function run, and that used as the value in the data"
				expect( 'attribute3' in data ).toBe( false );  // orig YUI Test err msg: "attribute3 should not exist in the 'changes' data, as it was never changed"
			} );
			
			
			it( "when the `raw` option is provided as true, Model::getChanges() should return the data by running attributes' `raw` functions (not using `get`)", function() {
				var MyModel = Model.extend( {
					attributes : [
						'attribute1', 
						{ name: 'attribute2', get: function( model, value ) { return "42 " + model.get( 'attribute1' ); } },
						{ name: 'attribute3', raw: function( model, value ) { return value + " " + model.get( 'attribute1' ); } },
						{ name: 'attribute4', defaultValue: 'value4' }
					]
				} );
				var model = new MyModel();
				model.set( 'attribute1', 'value1' );
				model.set( 'attribute2', 'value2' ); 
				model.set( 'attribute3', 'value3' ); 
				
				var data = model.getChanges( { raw: true } );
				expect( data.attribute1 ).toBe( 'value1' );  // orig YUI Test err msg: "attribute1 should be 'value1'"
				expect( data.attribute2 ).toBe( 'value2' );  // orig YUI Test err msg: "attribute2 should NOT have had its `get` function run. Its underlying data should have been returned"
				expect( data.attribute3 ).toBe( 'value3 value1' );  // orig YUI Test err msg: "attribute3 should have had its `raw` function run, and that value returned"
				expect( 'attribute4' in data ).toBe( false );  // orig YUI Test err msg: "attribute4 should not exist in the 'changes' data, as it was never changed"
			} );
			
			
			it( "Model::getChanges() should only retrieve the data for the persisted attributes (i.e. attributes with persist: true) that have been changed when the `persistedOnly` option is set to true", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name : 'attribute1', persist: true },
						{ name : 'attribute2', persist: false },
						{ name : 'attribute3', persist: true },
						{ name : 'attribute4', persist: false }
					]
				} );
				
				var model = new MyModel();
				model.set( 'attribute1', 'value1' );
				model.set( 'attribute2', 'value2' );
				
				var persistedChanges = model.getChanges( { persistedOnly: true } );
				expect( _.keys( persistedChanges ).length ).toBe( 1 );  // orig YUI Test err msg: "The persisted changes should only have 1 property"
				expect( persistedChanges.hasOwnProperty( 'attribute1' ) ).toBe( true );  // orig YUI Test err msg: "The persisted changes should only have 'attribute1'"
			} );
			
		} );
		
	} );
} );