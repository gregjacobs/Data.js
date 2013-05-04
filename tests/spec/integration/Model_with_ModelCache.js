/*global define, window, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model'
], function( Model ) {
		
	describe( "Integration: Model with ModelCache", function() {
		
		describe( "Duplicate models should not be able to be instantiated", function() {
			
			it( "Instatiating two models of different types, but the same instance ID, should *not* be 'combined' into the same instance", function() {
				var ModelClass1 = Model.extend( {
					attributes : [ 'id' ],
					idAttribute : 'id'
				} );
				var ModelClass2 = Model.extend( {
					attributes : [ 'id' ],
					idAttribute : 'id'
				} );
				
				var model1 = new ModelClass1( { id: 1 } );  // same id, but
				var model2 = new ModelClass2( { id: 1 } );  // different classes
				
				expect( model2 ).not.toBe( model1 );
			} );
			
			
			it( "Instatiating two models of the same type, but the different instance IDs, should *not* be 'combined' into the same instance", function() {
				var MyModel = Model.extend( {
					attributes : [ 'id' ],
					idAttribute : 'id'
				} );
				
				var model1 = new MyModel( { id: 1 } );  // different id, but
				var model2 = new MyModel( { id: 2 } );  // same class
				
				expect( model2 ).not.toBe( model1 );
			} );
			
			
			it( "Instantiating two models of both the same type, and which have the same instance ID, should really become the same single instance (i.e. not duplicating it). The same reference should be returned when constructing the duplicate model", function() {
				var MyModel = Model.extend( {
					attributes : [ 'id' ],
					idAttribute : 'id'
				} );
				
				var model1 = new MyModel( { id: 1 } );
				var model2 = new MyModel( { id: 1 } );
				
				// Make sure that only one model was created for id 1
				expect( model2 ).toBe( model1 );  // orig YUI Test err msg: "model1 and model2 should point to the same object"
			} );
			
			
			it( "Instantiating one model and setting the ID later, then instantiating another with the same ID, the two models should point to the same instance", function() {
				var MyModel = Model.extend( {
					attributes : [ 'id' ],
					idAttribute : 'id'
				} );
				
				var model1 = new MyModel();
				model1.set( 'id', 1 );
					
				var model2 = new MyModel( { id: 1 } );
				
				// Make sure that only one model was created for id 1
				expect( model2 ).toBe( model1 );  // orig YUI Test err msg: "model1 and model2 should point to the same object"
			} );
			
			
			it( "Instantiating two models with the same ID should combine the initial data, with still, only one actual instance should be created", function() {
				var MyModel = Model.extend( {
					attributes : [ 'id', 'firstName', 'lastName' ],
					idAttribute : 'id'
				} );
				
				var model1 = new MyModel( { id: 1, firstName: "Joe" } );
				var model2 = new MyModel( { id: 1, lastName: "Shmo" } );
				
				// Make sure that only one model was created for id 1
				expect( model2 ).toBe( model1 );  // orig YUI Test err msg: "model1 and model2 should point to the same object"
				
				// Make sure that the data was combined onto the same model instance
				expect( model1.get( 'firstName' ) ).toBe( "Joe" );
				expect( model1.get( 'lastName' ) ).toBe( "Shmo" );
			} );
			
		} );
		
	} );
} );