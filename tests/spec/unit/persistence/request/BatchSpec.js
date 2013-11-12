/*global define, describe, beforeEach, it, expect */
define( [
	'Class',
	'data/persistence/request/Batch',
	'data/persistence/request/Request'
], function( Class, RequestBatch, Request ) {
	
	var ConcreteRequest = Class.extend( Request, {
		// Implementation of abstract interface
		getAction : function() {}
	} );
	
	
	describe( 'data.persistence.request.Batch', function() {
		var op1, op2, op3;
		
		beforeEach( function() {
			op1 = new ConcreteRequest();
			op2 = new ConcreteRequest();
			op3 = new ConcreteRequest();
		} );
		
		
		describe( 'wasSuccessful()', function() {
			
			it( "should return `true` if all Requests completed successfully", function() {
				op1.setSuccess();
				op2.setSuccess();
				
				var batch = new RequestBatch( {
					requests : [ op1, op2 ]
				} );
				expect( batch.wasSuccessful() ).toBe( true );
			} );
			
			
			it( "should return `false` if just one Request failed", function() {
				op1.setSuccess();
				op2.setError( "An error occurred" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2 ]
				} );
				expect( batch.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'hasErrored()', function() {
			
			it( "should return `true` if just one Request failed", function() {
				op1.setSuccess();
				op2.setError( "An error occurred" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2 ]
				} );
				expect( batch.hasErrored() ).toBe( true );
			} );
			
			
			it( "should return `false` if all Requests completed successfully", function() {
				op1.setSuccess();
				op2.setSuccess();
				
				var batch = new RequestBatch( {
					requests : [ op1, op2 ]
				} );
				expect( batch.hasErrored() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'getSuccessfulRequests()', function() {
			
			it( "should return an array of the Request objects that have failed (errored)", function() {
				op1.setSuccess();
				op2.setError( "An error occurred" );
				op3.setError( "An error occurred 2" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.getSuccessfulRequests() ).toEqual( [ op1 ] );
			} );
			
			
			it( "should return an array of all of the Request objects if they were all successful", function() {
				op1.setSuccess();
				op2.setSuccess();
				op3.setSuccess();
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.getSuccessfulRequests() ).toEqual( [ op1, op2, op3 ] );
			} );
			
			
			it( "should return an empty array if all Request objects failed", function() {
				op1.setError( "An error occurred" );
				op2.setError( "An error occurred 2" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2 ]
				} );
				expect( batch.getSuccessfulRequests() ).toEqual( [] );
			} );
			
		} );
		
		
		describe( 'getErroredRequests()', function() {
			
			it( "should return an array of the Request objects that have failed (errored)", function() {
				op1.setSuccess();
				op2.setError( "An error occurred" );
				op3.setError( "An error occurred" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.getErroredRequests() ).toEqual( [ op2, op3 ] );
			} );
			
			
			it( "should return an array of all of the Request objects if they all failed (errored)", function() {
				op1.setError( "An error occurred" );
				op2.setError( "An error occurred" );
				op3.setError( "An error occurred" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.getErroredRequests() ).toEqual( [ op1, op2, op3 ] );
			} );
			
			
			it( "should return an empty array if all Request objects completed successfully", function() {
				op1.setSuccess();
				op2.setSuccess();
				
				var batch = new RequestBatch( {
					requests : [ op1, op2 ]
				} );
				expect( batch.getErroredRequests() ).toEqual( [] );
			} );
			
		} );
		
		
		describe( 'isComplete()', function() {
			
			it( "should return true if all requests are complete (success or errored)", function() {
				op1.setSuccess();
				op2.setError( "An error occurred" );
				op3.setError( "An error occurred" );
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.isComplete() ).toBe( true );
			} );
			
			
			it( "should return false if just one request is not yet complete", function() {
				op1.setSuccess();
				op2.setSuccess();
				//op3.setSuccess();  -- this one is not yet complete
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.isComplete() ).toBe( false );
			} );
			
			
			it( "should return false if all requests are not yet complete", function() {
				//op3.setSuccess();  -- not yet complete
				//op3.setSuccess();  -- not yet complete
				//op3.setSuccess();  -- not yet complete
				
				var batch = new RequestBatch( {
					requests : [ op1, op2, op3 ]
				} );
				expect( batch.isComplete() ).toBe( false );
			} );
			
		} );
		
	} );
	
} );