/*global define, window, _, describe, beforeEach, afterEach, it, xit, expect, spyOn */
define( [
	'data/persistence/operation/Operation',
	'data/persistence/operation/Promise',
	
	'data/persistence/request/Request',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy',
	
	'data/persistence/ResultSet',
	
	'data/Model',                    // Used as the `dataComponent` of the Operations
	'data/persistence/proxy/Proxy',  // Used as the `proxy` of the Operations
	'spec/lib/ManualProxy'
], function(
	Operation,
	OperationPromise,
	
	Request,
	CreateRequest,
	ReadRequest,
	UpdateRequest,
	DestroyRequest,
	
	ResultSet,
		
	Model,
	Proxy,
	ManualProxy
) {
	
	describe( 'data.persistence.operation.Operation', function() {
		
		var emptyFn = function() {};
		
		// Concrete Subclasses
		var ConcreteOperation = Operation.extend( {} );
		var ConcreteRequest = Request.extend( {
			// Implementation of abstract interface
			getAction : function() {}
		} );
		
		var ConcreteProxy = Proxy.extend( {
			create  : emptyFn,
			read    : emptyFn,
			update  : emptyFn,
			destroy : emptyFn
		} );
		
		// Used as the `dataComponent` of the Operations
		var model;
		
		// Used as the `proxy` of the Operations
		var proxy = new ConcreteProxy();
		var manualProxy;
		
		
		beforeEach( function() {
			model = new Model();
			manualProxy = new ManualProxy();
		} );
		
		
		// -----------------------------------
		
		// Requests' interface
		
		describe( 'executeRequests()', function() {
			var operation,
			    requests;
			
			beforeEach( function() {
				requests = [ new CreateRequest(), new ReadRequest(), new UpdateRequest(), new DestroyRequest() ];
				
				operation = new ConcreteOperation( { dataComponent: model, proxy: manualProxy, requests: requests } );
			} );
			
			
			it( "should execute each Request with the Operation's proxy", function() {
				operation.executeRequests();
				expect( manualProxy.getCreateRequestCount() ).toBe( 1 );
				expect( manualProxy.getReadRequestCount() ).toBe( 1 );
				expect( manualProxy.getUpdateRequestCount() ).toBe( 1 );
				expect( manualProxy.getDestroyRequestCount() ).toBe( 1 );
			} );
			
			
			it( "should resolve the Operation's 'requests deferred' when all requests are complete", function() {
				var requestsPromise = operation.executeRequests();
				expect( requestsPromise.state() ).toBe( 'pending' );  // initial condition
				expect( requests[ 0 ].wasSuccessful() ).toBe( false );  // initial condition
				expect( requests[ 1 ].wasSuccessful() ).toBe( false );  // initial condition
				expect( requests[ 2 ].wasSuccessful() ).toBe( false );  // initial condition
				expect( requests[ 3 ].wasSuccessful() ).toBe( false );  // initial condition
				
				manualProxy.resolveCreate( 0 );
				expect( requestsPromise.state() ).toBe( 'pending' );
				expect( requests[ 0 ].wasSuccessful() ).toBe( true );
				
				manualProxy.resolveRead( 0 );
				expect( requestsPromise.state() ).toBe( 'pending' );
				expect( requests[ 1 ].wasSuccessful() ).toBe( true );
				
				manualProxy.resolveUpdate( 0 );
				expect( requestsPromise.state() ).toBe( 'pending' );
				expect( requests[ 2 ].wasSuccessful() ).toBe( true );
				
				manualProxy.resolveDestroy( 0 );
				expect( requestsPromise.state() ).toBe( 'resolved' );
				expect( requests[ 3 ].wasSuccessful() ).toBe( true );
			} );
			
			
			it( "should reject the Operation's 'requests deferred' when just one of the requests have errored", function() {
				var requestsPromise = operation.executeRequests();
				expect( requestsPromise.state() ).toBe( 'pending' );  // initial condition
				
				manualProxy.rejectCreate( 0 );
				expect( requestsPromise.state() ).toBe( 'rejected' );
				expect( requests[ 0 ].hasErrored() ).toBe( true );
			} );
			
			
			it( "should not attach a ResultSet object to the Requests if one was not provided by the proxy", function() {
				var requestsPromise = operation.executeRequests();
				
				manualProxy.resolveCreate( 0 );
				manualProxy.resolveRead( 0 );
				manualProxy.resolveUpdate( 0 );
				manualProxy.resolveDestroy( 0 );
				
				expect( requestsPromise.state() ).toBe( 'resolved' );
				expect( requests[ 0 ].getResultSet() ).toBe( null );
				expect( requests[ 1 ].getResultSet() ).toBe( null );
				expect( requests[ 2 ].getResultSet() ).toBe( null );
				expect( requests[ 3 ].getResultSet() ).toBe( null );
			} );
			
			
			it( "should attach a ResultSet object to the Requests if one was provided by the proxy", function() {
				var resultSets = [ new ResultSet(), new ResultSet(), new ResultSet(), new ResultSet() ],
				    requestsPromise = operation.executeRequests();
				
				manualProxy.resolveCreate( 0, resultSets[ 0 ] );
				manualProxy.resolveRead( 0, resultSets[ 1 ] );
				manualProxy.resolveUpdate( 0, resultSets[ 2 ] );
				manualProxy.resolveDestroy( 0, resultSets[ 3 ] );
				
				expect( requestsPromise.state() ).toBe( 'resolved' );
				expect( requests[ 0 ].getResultSet() ).toBe( resultSets[ 0 ] );
				expect( requests[ 1 ].getResultSet() ).toBe( resultSets[ 1 ] );
				expect( requests[ 2 ].getResultSet() ).toBe( resultSets[ 2 ] );
				expect( requests[ 3 ].getResultSet() ).toBe( resultSets[ 3 ] );
			} );
			
		} );
		
		
		describe( 'getIncompleteRequests()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return an empty array when the Operation does not yet have any Requests", function() {
				expect( operation.getIncompleteRequests() ).toEqual( [] );
			} );
			
			
			it( "should return none of the requests if all of them are complete", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				
				// Set both requests to "complete"
				requests[ 0 ].setSuccess();
				requests[ 1 ].setError();
				
				var resultRequests = operation.getIncompleteRequests();
				expect( resultRequests ).toEqual( [] );
			} );
			
			
			it( "should return all of the requests if all of them are incomplete", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				
				var resultRequests = operation.getIncompleteRequests();
				expect( resultRequests[ 0 ] ).toBe( requests[ 0 ] );
				expect( resultRequests[ 1 ] ).toBe( requests[ 1 ] );
			} );
			
			
			it( "should only return the requests that are incomplete out of the full list of requests", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest(),
					new ConcreteRequest(),
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				
				// Set 2 middle requests to "complete"
				requests[ 1 ].setSuccess();
				requests[ 3 ].setError();
				
				var resultRequests = operation.getIncompleteRequests();
				expect( resultRequests.length ).toBe( 3 );  // 3 incomplete requests
				expect( resultRequests[ 0 ] ).toBe( requests[ 0 ] );
				expect( resultRequests[ 1 ] ).toBe( requests[ 2 ] );
				expect( resultRequests[ 2 ] ).toBe( requests[ 4 ] );
			} );
			
		} );
		
		
		describe( 'getSuccessfulRequests()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return an empty array when the Operation does not yet have any Requests", function() {
				expect( operation.getSuccessfulRequests() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the successful Requests in the Operation", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.getSuccessfulRequests() ).toEqual( [] );  // initial condition
				
				var resultRequests;
				
				// A successful request
				requests[ 0 ].setSuccess();
				resultRequests = operation.getSuccessfulRequests();
				expect( resultRequests.length ).toBe( 1 );  // 1 successful request at this point
				expect( resultRequests[ 0 ] ).toBe( requests[ 0 ] );
				
				// An errored request
				requests[ 1 ].setError();
				resultRequests = operation.getSuccessfulRequests();
				expect( resultRequests.length ).toBe( 1 );  // still only 1 successful request at this point
				expect( resultRequests[ 0 ] ).toBe( requests[ 0 ] );
				
				// Another successful request
				requests[ 2 ].setSuccess();
				resultRequests = operation.getSuccessfulRequests();
				expect( resultRequests.length ).toBe( 2 );  // 2 successful request at this point
				expect( resultRequests[ 0 ] ).toBe( requests[ 0 ] );
				expect( resultRequests[ 1 ] ).toBe( requests[ 2 ] );
			} );
			
		} );
		
		
		describe( 'getErroredRequests()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return an empty array when the Operation does not yet have any Requests", function() {
				expect( operation.getErroredRequests() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the successful Requests in the Operation", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.getErroredRequests() ).toEqual( [] );  // initial condition
				
				var resultRequests;
				
				// A successful request
				requests[ 0 ].setSuccess();
				resultRequests = operation.getErroredRequests();
				expect( resultRequests.length ).toBe( 0 );  // no errored requests at this point
				
				// An errored request
				requests[ 1 ].setError();
				resultRequests = operation.getErroredRequests();
				expect( resultRequests.length ).toBe( 1 );  // 1 errored request at this point
				expect( resultRequests[ 0 ] ).toBe( requests[ 1 ] );
				
				// Another errored request
				requests[ 2 ].setError();
				resultRequests = operation.getErroredRequests();
				expect( resultRequests.length ).toBe( 2 );  // 2 errored requests at this point
				expect( resultRequests[ 0 ] ).toBe( requests[ 1 ] );
				expect( resultRequests[ 1 ] ).toBe( requests[ 2 ] );
			} );
			
		} );
		
		
		describe( 'requestsAreComplete()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
		
			
			it( "should return `true` when the Operation has 0 requests", function() {
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
			
			it( "should return `true` when all requests have been completed successfully", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsAreComplete() ).toBe( false );  // initial condition
				
				// Set one request to be successful
				requests[ 0 ].setSuccess();
				expect( operation.requestsAreComplete() ).toBe( false );
				
				// Set the other request to be successful
				requests[ 1 ].setSuccess();
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
			
			it( "should return `true` when all requests have been completed in an error state", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsAreComplete() ).toBe( false );  // initial condition
				
				// Set one request to have errored
				requests[ 0 ].setError();
				expect( operation.requestsAreComplete() ).toBe( false );
				
				// Set the other request to have errored
				requests[ 1 ].setError();
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
			
			it( "should return `true` when all requests have been completed (all in either a success or error state)", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsAreComplete() ).toBe( false );  // initial condition
				
				// Set one request to be complete
				requests[ 0 ].setSuccess();
				expect( operation.requestsAreComplete() ).toBe( false );
				
				// Set the other request to be complete
				requests[ 1 ].setError();
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'requestsWereSuccessful()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
		
			
			it( "should return `true` when the Operation has 0 requests", function() {
				expect( operation.requestsWereSuccessful() ).toBe( true );
			} );
			
			
			it( "should return `true` when all requests have succeeded", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsWereSuccessful() ).toBe( false );  // initial condition
				
				// Set one request to be successful
				requests[ 0 ].setSuccess();
				expect( operation.requestsWereSuccessful() ).toBe( false );
				
				// Set the other request to be successful
				requests[ 1 ].setSuccess();
				expect( operation.requestsWereSuccessful() ).toBe( true );
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
			
			it( "should return `false` when one or more requests did not succeed", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsWereSuccessful() ).toBe( false );  // initial condition
				
				// Set one request to be successful
				requests[ 0 ].setSuccess();
				expect( operation.requestsWereSuccessful() ).toBe( false );
				
				// Set the other request to be an errored request
				requests[ 1 ].setError();
				expect( operation.requestsWereSuccessful() ).toBe( false );
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'requestsHaveErrored()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
		
			
			it( "should return `false` when the Operation has 0 requests", function() {
				expect( operation.requestsHaveErrored() ).toBe( false );
			} );
			
			
			it( "should return `true` when one or more requests have errored", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsHaveErrored() ).toBe( false );  // initial condition
				
				// Set one request to be successful
				requests[ 0 ].setSuccess();
				expect( operation.requestsHaveErrored() ).toBe( false );
				
				// Set the second request to have errored
				requests[ 1 ].setError();
				expect( operation.requestsHaveErrored() ).toBe( true );
				
				// Set the thrd request to be successful
				requests[ 2 ].setSuccess();
				expect( operation.requestsHaveErrored() ).toBe( true );  // from the 2nd one "erroring"
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
			
			it( "should return `false` when all requests have succeeded", function() {
				var requests = [
					new ConcreteRequest(),
					new ConcreteRequest()
				];
				operation.setRequests( requests );
				expect( operation.requestsHaveErrored() ).toBe( false );  // initial condition
				
				// Set one request to be successful
				requests[ 0 ].setSuccess();
				expect( operation.requestsHaveErrored() ).toBe( false );
				
				// Set the other request to be an errored request
				requests[ 1 ].setSuccess();
				expect( operation.requestsHaveErrored() ).toBe( false );
				expect( operation.requestsAreComplete() ).toBe( true );
			} );
			
		} );
		
		
		// -----------------------------------
		
		// Operation's state interface
		
		
		describe( 'resolve()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been resolved", function() {
				operation.resolve();
				operation.reject();  // attempt to reject, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( true );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'aborted' after it has been resolved", function() {
				operation.resolve();
				operation.abort();  // attempt to abort, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( true );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'wasSuccessful()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.wasSuccessful() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.wasSuccessful() ).toBe( true );
			} );
			
			it( "should return `false` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.wasSuccessful() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'reject()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should prevent the Operation from becoming 'successful' after it has been rejected", function() {
				operation.reject();
				operation.resolve();  // attempt to resolve, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( true );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'aborted' after it has been rejected", function() {
				operation.reject();
				operation.abort();  // attempt to abort, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( true );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'hasErrored()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.hasErrored() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.hasErrored() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.hasErrored() ).toBe( true );
			} );
			
			it( "should return `false` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.hasErrored() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'abort()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should prevent the Operation from becoming 'successful' after it has been aborted", function() {
				operation.abort();
				operation.resolve();  // attempt to resolve, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( true );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been aborted", function() {
				operation.abort();
				operation.reject();  // attempt to reject, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( true );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should call the proxy's abort() method with only the remaining incomplete requests", function() {
				spyOn( proxy, 'abort' );
				
				var requests = [ new ConcreteRequest(), new ConcreteRequest(), new ConcreteRequest() ];
				requests[ 0 ].setSuccess();
				//requests[ 1 ].setSuccess(); -- not successful yet
				//requests[ 2 ].setSuccess(); -- not successful yet
				
				operation.setRequests( requests );
				
				operation.abort();
				expect( proxy.abort.calls.length ).toBe( 2 );
				expect( proxy.abort ).toHaveBeenCalledWith( requests[ 1 ] );
				expect( proxy.abort ).toHaveBeenCalledWith( requests[ 2 ] );
			} );
			
			
			it( "should not call the proxy's abort() method if there are no incomplete requests remaining", function() {
				spyOn( proxy, 'abort' );
				
				var requests = [ new ConcreteRequest(), new ConcreteRequest() ];
				requests[ 0 ].setSuccess();
				requests[ 1 ].setSuccess();
				
				operation.setRequests( requests );
				
				operation.abort();
				expect( proxy.abort ).not.toHaveBeenCalled();
			} );
			
		} );
		
		
		describe( 'wasAborted()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.wasAborted() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.wasAborted() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.wasAborted() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.wasAborted() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'isComplete()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.isComplete() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.isComplete() ).toBe( true );
			} );
			
			it( "should return `true` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.isComplete() ).toBe( true );
			} );
			
			it( "should return `true` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.isComplete() ).toBe( true );
			} );
			
		} );
		
		
		// -----------------------------------
		
		// Promise Interface
		
		describe( 'promise()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should return an OperationPromise instance that is a view of the Operation", function() {				
				var promise = operation.promise();
				
				expect( promise instanceof OperationPromise ).toBe( true );
			} );
			
			it( "should return the same OperationPromise instance for multiple calls (testing lazy instantiation)", function() {				
				var promise1 = operation.promise(),
				    promise2 = operation.promise();
				
				expect( promise1 ).toBe( promise2 );
			} );
			
		} );
		
		
		describe( 'done()', function() {
			
			it( "should register a handler to be called upon Operation success", function() {
				var operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    doneCallCount = 0;
				
				operation.done( function( dataComponent, op ) { 
					doneCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.resolve();
				expect( doneCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
		
		describe( 'fail()', function() {
			
			it( "should register a handler to be called upon Operation error", function() {
				var operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    errorCallCount = 0;
				
				operation.fail( function( dataComponent, op ) { 
					errorCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.reject();
				expect( errorCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
		
		describe( 'cancel()', function() {
			
			it( "should register a handler to be called if the Operation is aborted (canceled)", function() {
				var operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    cancelCallCount = 0;
				
				operation.cancel( function( dataComponent, op ) { 
					cancelCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.abort();
				expect( cancelCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
		
		describe( 'always()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should register a handler to be called upon Operation success", function() {
				var alwaysCallCount = 0;
				
				operation.always( function( dataComponent, op ) { 
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.resolve();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Operation error", function() {
				var alwaysCallCount = 0;
				
				operation.always( function( dataComponent, op ) {
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.reject();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Operation cancellation", function() {
				var alwaysCallCount = 0;
				
				operation.always( function( dataComponent, op ) {
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.abort();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
	} );
	
} );