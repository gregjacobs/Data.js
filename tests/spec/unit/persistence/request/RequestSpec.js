/*global define, describe, beforeEach, it, expect */
define( [
	'data/persistence/request/Request'
], function( Request ) {
	
	var ConcreteRequest = Request.extend( {
		// Implementation of abstract interface
		getAction : function() {}
	} );
	
	
	describe( 'data.persistence.request.Request', function() {
		
		describe( 'isComplete()', function() {
			var request;
			
			beforeEach( function() {
				request = new ConcreteRequest();
			} );
			
			
			it( "should return `false` if the Request has not yet been marked as successful or errored", function() {
				expect( request.isComplete() ).toBe( false );
			} );
			
			
			it( "should return `true` if the Request has been marked as successful", function() {
				request.setSuccess();
				expect( request.isComplete() ).toBe( true );
			} );
			
			
			it( "should return `true` if the Request has been marked as errored", function() {
				request.setException();
				expect( request.isComplete() ).toBe( true );
			} );
			
		} );
		
	} );
	
} );