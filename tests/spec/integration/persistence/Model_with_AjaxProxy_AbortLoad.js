/*global define, window, _, describe, beforeEach, afterEach, it, expect */
define( [
	'data/Model',
	
	'data/persistence/proxy/Ajax',
	'spec/lib/MockAjax'
], function( Model, AjaxProxy, MockAjax ) {

	describe( "Integration: Aborting a Model's load() with AjaxProxy", function() {
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
				attributes : [ 'id', 'name' ],
				proxy : proxy
			} );
		} );
		
		
		it( "should abort the underlying AJAX request when the user aborts the Operation", function() {
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