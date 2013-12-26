/*global define, window, describe, beforeEach, afterEach, it, expect */
define( [
	'data/Model',
	
	'data/persistence/proxy/Ajax',
	'spec/lib/MockAjax'
], function( Model, AjaxProxy, MockAjax ) {

	describe( "Integration: Model's load() with AjaxProxy", function() {
		var mockAjax,
		    proxy,
		    TestModel;
		
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
				],
				proxy : proxy
			} );
		} );
		
		
		
		it( "should load data provided by the AJAX proxy", function() {
			var model = new TestModel();
			
			var operation = model.load();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( operation.state() ).toBe( 'pending' );
			expect( model.isLoading() ).toBe( true );           // initial condition
			
			mockAjax.resolveRequest( 0, { id: 1, name: "Test Model Name" } );
			expect( operation.state() ).toBe( 'resolved' );
			expect( model.getData() ).toEqual( { id: 1, name: "Test Model Name" } );
		} );
		
		
		it( "should handle the AJAX proxy failing to load data", function() {
			var model = new TestModel();
			
			var operation = model.load();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( operation.state() ).toBe( 'pending' );
			expect( model.isLoading() ).toBe( true );           // initial condition
			
			mockAjax.rejectRequest( 0, "Error" );
			expect( operation.state() ).toBe( 'rejected' );
			expect( model.getData() ).toEqual( { id: 0, name: "" } );
		} );
		
		
		it( "should abort the underlying AJAX request if the user aborts the Operation", function() {
			var model = new TestModel();
			
			var operation = model.load();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( mockAjax.wasAborted( 0 ) ).toBe( false );   // initial condition
			expect( model.isLoading() ).toBe( true );           // initial condition
			
			operation.abort();
			expect( mockAjax.getRequestCount() ).toBe( 1 );
			expect( mockAjax.wasAborted( 0 ) ).toBe( true );   // ajax request was aborted
			expect( model.isLoading() ).toBe( false );
		} );
		
	} );
	
} );