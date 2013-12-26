/*global define, window, describe, beforeEach, afterEach, it, expect */
define( [
	'data/Collection',
	'data/Model',
	
	'data/persistence/proxy/Ajax',
	'spec/lib/MockAjax'
], function( Collection, Model, AjaxProxy, MockAjax ) {

	describe( "Integration: Collection's load() with AjaxProxy", function() {
		var mockAjax,
		    proxy,
		    TestModel,
		    TestCollection;
		
		beforeEach( function() {
			mockAjax = new MockAjax();
			
			proxy = new AjaxProxy( {
				url  : '/testUrl',
				ajax : mockAjax.getAjaxMethod()
			} );
			
			TestModel = Model.extend( {
				attributes : [ 
					{ name: 'id',   type: 'int',    defaultValue: 0 },
					{ name: 'name', type: 'string', defaultValue: "" }
				]
			} );
			
			TestCollection = Collection.extend( {
				model : TestModel,
				proxy : proxy
			} );
		} );
		
		
		it( "should load data provided by the AJAX proxy", function() {
			var collection = new TestCollection();
			
			var operation = collection.load();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( operation.state() ).toBe( 'pending' );
			expect( collection.isLoading() ).toBe( true );           // initial condition
			
			mockAjax.resolveRequest( 0, [ { id: 1, name: "Test Model Name" } ] );
			expect( operation.state() ).toBe( 'resolved' );
			expect( collection.getCount() ).toBe( 1 );
			expect( collection.getAt( 0 ).getData() ).toEqual( { id: 1, name: "Test Model Name" } );
		} );
		
		
		it( "should handle the AJAX proxy failing to load data", function() {
			var collection = new TestCollection();
			
			var operation = collection.load();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( operation.state() ).toBe( 'pending' );
			expect( collection.isLoading() ).toBe( true );           // initial condition
			
			mockAjax.rejectRequest( 0, "Error" );
			expect( operation.state() ).toBe( 'rejected' );
			expect( collection.getCount() ).toBe( 0 );
		} );
		
		
		it( "should abort the underlying AJAX request when the user aborts the Operation", function() {
			var collection = new TestCollection();
			
			var operation = collection.load();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( mockAjax.wasAborted( 0 ) ).toBe( false );   // initial condition
			expect( collection.isLoading() ).toBe( true );      // initial condition
			
			operation.abort();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( mockAjax.wasAborted( 0 ) ).toBe( true );   // ajax request was aborted
			expect( collection.isLoading() ).toBe( false );
		} );
		
	} );
	
} );