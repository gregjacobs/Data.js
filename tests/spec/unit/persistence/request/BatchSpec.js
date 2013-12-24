/*global define, describe, beforeEach, it, expect */
define( [
	'Class',
	
	'data/persistence/request/Batch',
	'data/persistence/request/Request',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy'
], function( Class, Batch, Request, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest ) {
	
	var ConcreteRequest = Class.extend( Request, {
		// Implementation of abstract interface
		getAction : function() {}
	} );
	
	
	describe( 'data.persistence.request.Batch', function() {
		var req1, req2, req3,
		    createRequest1, createRequest2,
		    updateRequest1, updateRequest2,
		    destroyRequest1, destroyRequest2;
		
		beforeEach( function() {
			req1 = new ConcreteRequest();
			req2 = new ConcreteRequest();
			req3 = new ConcreteRequest();
			
			createRequest1 = new CreateRequest();
			createRequest2 = new CreateRequest();
			updateRequest1 = new UpdateRequest();
			updateRequest2 = new UpdateRequest();
			destroyRequest1 = new DestroyRequest();
			destroyRequest2 = new DestroyRequest();
		} );
		
		
		describe( 'getCreateRequests()', function() {
			
			it( "should return an empty array if there are no 'create' requests in the Batch", function() {
				var batch = new Batch( {
					requests : [ new UpdateRequest(), new DestroyRequest() ]
				} );
				
				expect( batch.getCreateRequests() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the 'create' requests in the Batch", function() {
				var batch = new Batch( {
					requests : [ createRequest1, createRequest2, new UpdateRequest(), new DestroyRequest() ]
				} );
				
				var createRequests = batch.getCreateRequests();
				expect( createRequests.length ).toBe( 2 );
				expect( createRequests[ 0 ] ).toBe( createRequest1 );
				expect( createRequests[ 1 ] ).toBe( createRequest2 );
			} );
			
		} );
		
		
		describe( 'getUpdateRequests()', function() {
			
			it( "should return an empty array if there are no 'update' requests in the Batch", function() {
				var batch = new Batch( {
					requests : [ new CreateRequest(), new DestroyRequest() ]
				} );
				
				expect( batch.getUpdateRequests() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the 'update' requests in the Batch", function() {
				var batch = new Batch( {
					requests : [ new CreateRequest(), updateRequest1, updateRequest2, new DestroyRequest() ]
				} );
				
				var updateRequests = batch.getUpdateRequests();
				expect( updateRequests.length ).toBe( 2 );
				expect( updateRequests[ 0 ] ).toBe( updateRequest1 );
				expect( updateRequests[ 1 ] ).toBe( updateRequest2 );
			} );
			
		} );
		
		
		describe( 'getDestroyRequests()', function() {
			
			it( "should return an empty array if there are no 'destroy' requests in the Batch", function() {
				var batch = new Batch( {
					requests : [ new CreateRequest(), new UpdateRequest() ]
				} );
				
				expect( batch.getDestroyRequests() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the 'destroy' requests in the Batch", function() {
				var batch = new Batch( {
					requests : [ new CreateRequest(), new UpdateRequest(), destroyRequest1, destroyRequest2 ]
				} );
				
				var destroyRequests = batch.getDestroyRequests();
				expect( destroyRequests.length ).toBe( 2 );
				expect( destroyRequests[ 0 ] ).toBe( destroyRequest1 );
				expect( destroyRequests[ 1 ] ).toBe( destroyRequest2 );
			} );
			
		} );
		
		
		describe( 'wasSuccessful()', function() {
			
			it( "should return `true` if all Requests completed successfully", function() {
				req1.setSuccess();
				req2.setSuccess();
				
				var batch = new Batch( {
					requests : [ req1, req2 ]
				} );
				expect( batch.wasSuccessful() ).toBe( true );
			} );
			
			
			it( "should return `false` if just one Request failed", function() {
				req1.setSuccess();
				req2.setError( "An error occurred" );
				
				var batch = new Batch( {
					requests : [ req1, req2 ]
				} );
				expect( batch.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'hasErrored()', function() {
			
			it( "should return `true` if just one Request failed", function() {
				req1.setSuccess();
				req2.setError( "An error occurred" );
				
				var batch = new Batch( {
					requests : [ req1, req2 ]
				} );
				expect( batch.hasErrored() ).toBe( true );
			} );
			
			
			it( "should return `false` if all Requests completed successfully", function() {
				req1.setSuccess();
				req2.setSuccess();
				
				var batch = new Batch( {
					requests : [ req1, req2 ]
				} );
				expect( batch.hasErrored() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'getSuccessfulRequests()', function() {
			
			it( "should return an array of the Request objects that have failed (errored)", function() {
				req1.setSuccess();
				req2.setError( "An error occurred" );
				req3.setError( "An error occurred 2" );
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.getSuccessfulRequests() ).toEqual( [ req1 ] );
			} );
			
			
			it( "should return an array of all of the Request objects if they were all successful", function() {
				req1.setSuccess();
				req2.setSuccess();
				req3.setSuccess();
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.getSuccessfulRequests() ).toEqual( [ req1, req2, req3 ] );
			} );
			
			
			it( "should return an empty array if all Request objects failed", function() {
				req1.setError( "An error occurred" );
				req2.setError( "An error occurred 2" );
				
				var batch = new Batch( {
					requests : [ req1, req2 ]
				} );
				expect( batch.getSuccessfulRequests() ).toEqual( [] );
			} );
			
		} );
		
		
		describe( 'getErroredRequests()', function() {
			
			it( "should return an array of the Request objects that have failed (errored)", function() {
				req1.setSuccess();
				req2.setError( "An error occurred" );
				req3.setError( "An error occurred" );
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.getErroredRequests() ).toEqual( [ req2, req3 ] );
			} );
			
			
			it( "should return an array of all of the Request objects if they all failed (errored)", function() {
				req1.setError( "An error occurred" );
				req2.setError( "An error occurred" );
				req3.setError( "An error occurred" );
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.getErroredRequests() ).toEqual( [ req1, req2, req3 ] );
			} );
			
			
			it( "should return an empty array if all Request objects completed successfully", function() {
				req1.setSuccess();
				req2.setSuccess();
				
				var batch = new Batch( {
					requests : [ req1, req2 ]
				} );
				expect( batch.getErroredRequests() ).toEqual( [] );
			} );
			
		} );
		
		
		describe( 'isComplete()', function() {
			
			it( "should return true if all requests are complete (success or errored)", function() {
				req1.setSuccess();
				req2.setError( "An error occurred" );
				req3.setError( "An error occurred" );
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.isComplete() ).toBe( true );
			} );
			
			
			it( "should return false if just one request is not yet complete", function() {
				req1.setSuccess();
				req2.setSuccess();
				//req3.setSuccess();  -- this one is not yet complete
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.isComplete() ).toBe( false );
			} );
			
			
			it( "should return false if all requests are not yet complete", function() {
				//req3.setSuccess();  -- not yet complete
				//req3.setSuccess();  -- not yet complete
				//req3.setSuccess();  -- not yet complete
				
				var batch = new Batch( {
					requests : [ req1, req2, req3 ]
				} );
				expect( batch.isComplete() ).toBe( false );
			} );
			
		} );
		
	} );
	
} );