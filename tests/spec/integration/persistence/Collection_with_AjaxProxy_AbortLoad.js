/*global define, window, _, describe, beforeEach, afterEach, it, expect */
define( [
	'data/Collection',
	
	'data/persistence/proxy/Ajax',
	'spec/lib/MockAjax'
], function( Collection, AjaxProxy, MockAjax ) {

	describe( "Integration: Aborting a Collection's load() with AjaxProxy", function() {
		var mockAjax,
		    proxy,
		    TestCollection;
		
		beforeEach( function() {
			mockAjax = new MockAjax();
			
			proxy = new AjaxProxy( {
				url  : '/testUrl',
				ajax : mockAjax.getAjaxMethod()
			} );
			
			TestCollection = Collection.extend( {
				proxy : proxy
			} );
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