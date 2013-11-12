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
		
		
		describe( 'wasSuccessful()', function() {
			var request;
			
			beforeEach( function() {
				request = new ConcreteRequest();
			} );
			
			
			it( "should return false when the Request has not yet been completed", function() {
				expect( request.isComplete() ).toBe( false );  // just double checking 
				
				expect( request.wasSuccessful() ).toBe( false );
			} );
			
			
			it( "should return true when the Request has been completed successfully", function() {
				request.setSuccess(); 
				
				expect( request.wasSuccessful() ).toBe( true );
			} );
			
			
			it( "should return false when the Request has errored without an 'error' object provided", function() {
				request.setError();
				
				expect( request.wasSuccessful() ).toBe( false );
			} );
			
			
			it( "should return false when the Request has errored with an 'error' object provided", function() {
				request.setError( "Error Message" );
				
				expect( request.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'hasErrored()', function() {
			var request;
			
			beforeEach( function() {
				request = new ConcreteRequest();
			} );
			
			
			it( "should return false when the Request has not yet been completed", function() {
				expect( request.isComplete() ).toBe( false );  // just double checking 
				
				expect( request.hasErrored() ).toBe( false );
			} );
			
			
			it( "should return false when the Request has been completed successfully", function() {
				request.setSuccess(); 
				
				expect( request.hasErrored() ).toBe( false );
			} );
			
			
			it( "should return true when the Request has errored without an 'error' object provided", function() {
				request.setError();
				
				expect( request.hasErrored() ).toBe( true );
			} );
			
			
			it( "should return true when the Request has errored with an 'error' object provided", function() {
				request.setError( "Error Message" );
				
				expect( request.hasErrored() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'getError()', function() {
			var request;
			
			beforeEach( function() {
				request = new ConcreteRequest();
			} );
			
			
			it( "should return `undefined` when the Request has not yet been completed", function() {
				expect( request.isComplete() ).toBe( false );  // just double checking 
				
				expect( request.getError() ).toBeUndefined();
			} );
			
			
			it( "should return `undefined` when the Request has been completed successfully", function() {
				request.setSuccess();
				
				expect( request.getError() ).toBeUndefined();
			} );
			
			
			it( "should return `undefined` when the Request has errored, but not 'error' object/string has been set", function() {
				request.setError();  // note: no 'error' argument provided to setError()
				
				expect( request.getError() ).toBeUndefined();
			} );
			
			
			it( "should return the 'error' object/string that has been set by setError()", function() {
				request.setError( "Error Message" );
				
				expect( request.getError() ).toBe( "Error Message" );
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
				request.setError();
				expect( request.isComplete() ).toBe( true );
			} );
			
		} );
		
	} );
	
} );