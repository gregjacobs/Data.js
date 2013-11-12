/*global define, describe, beforeEach, it, expect */
define( [
	'data/persistence/request/Request'
], function( Request ) {
	
	var ConcreteRequest = Request.extend( {
		// Implementation of abstract interface
		getAction : function() {}
	} );
	
	
	describe( 'data.persistence.request.Request', function() {
		
		describe( 'getUuid()', function() {
			
			it( "should return a new unique ID for each Request object that is instantiated", function() {
				var request1 = new ConcreteRequest(),
				    request2 = new ConcreteRequest();
				
				expect( typeof request1.getUuid() ).toBe( 'string' );
				expect( typeof request2.getUuid() ).toBe( 'string' );
				expect( request1.getUuid().length ).toBeGreaterThan( 0 );
				expect( request2.getUuid().length ).toBeGreaterThan( 0 );
				
				expect( request1.getUuid() ).not.toBe( request2.getUuid() );
			} );
			
			
			it( "should return the same unique ID for each call to the method", function() {
				var request = new ConcreteRequest();
				
				expect( request.getUuid() ).toBe( request.getUuid() );
			} );
			
		} );
		
		
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