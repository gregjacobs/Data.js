/*global define, window, describe, beforeEach, afterEach, it, xit, expect, spyOn */
define( [
	'jquery',
	
	'data/persistence/operation/Operation',
	
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
	jQuery,
	
	Operation,
	
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
		
		// Operation's Deferred/State interface
		
		
		describe( 'notify()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should call `progress` handlers with the args: [ dataComponent, operation ]", function() {
				var progressCallCount = 0;
				
				operation.progress( function( dataComponent, op ) { 
					progressCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.notify();
				
				expect( progressCallCount ).toBe( 1 );
				expect( operation.state() ).toBe( 'pending' );
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( false );
			} );
		} );
		
		
		describe( 'resolve()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been resolved", function() {
				operation.resolve();
				operation.reject();  // attempt to reject, which should have been blocked
				
				expect( operation.state() ).toBe( 'resolved' );
				expect( operation.wasSuccessful() ).toBe( true );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'aborted' after it has been resolved", function() {
				operation.resolve();
				operation.abort();  // attempt to abort, which should have been blocked
				
				expect( operation.state() ).toBe( 'resolved' );
				expect( operation.wasSuccessful() ).toBe( true );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
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
				
				expect( operation.state() ).toBe( 'rejected' );
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( true );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'aborted' after it has been rejected", function() {
				operation.reject();
				operation.abort();  // attempt to abort, which should have been blocked
				
				expect( operation.state() ).toBe( 'rejected' );
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( true );
				expect( operation.wasAborted() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
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
				
				expect( operation.state() ).toBe( 'aborted' );
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasAborted() ).toBe( true );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been aborted", function() {
				operation.abort();
				operation.reject();  // attempt to reject, which should have been blocked
				
				expect( operation.state() ).toBe( 'aborted' );
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
				expect( operation.state() ).toBe( 'aborted' );
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
				expect( operation.state() ).toBe( 'aborted' );
				expect( proxy.abort ).not.toHaveBeenCalled();
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
		
		// Operation's Promise Interface
		
		describe( 'promise()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should simply return the Operation itself (which is a 'deferred', but will act as the promise as well). This method is for jQuery promise compatibility when using jQuery.when()", function() {				
				var promise = operation.promise();
				
				expect( promise ).toBe( operation );
			} );
			
		} );
		
		
		describe( 'status()', function() {
			var operation,
			    request;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy, requests: request } );
			} );
			
			
			it( "should return 'pending' when the Operation has not yet been started, or is in progress", function() {				
				expect( operation.state() ).toBe( 'pending' );
				
				operation.executeRequests();
				expect( operation.state() ).toBe( 'pending' );
			} );
			
			
			it( "should return 'resolved' when the Operation has been resolved (i.e. it has completed successfully)", function() {				
				expect( operation.state() ).toBe( 'pending' );  // initial condition
				
				operation.resolve();
				expect( operation.state() ).toBe( 'resolved' );
			} );
			
			
			it( "should return 'rejected' when the Operation has been rejected (i.e. it has errored)", function() {				
				expect( operation.state() ).toBe( 'pending' );  // initial condition
				
				operation.reject();
				expect( operation.state() ).toBe( 'rejected' );
			} );
			
			
			it( "should return 'aborted' when the Operation has been aborted by the user", function() {				
				expect( operation.state() ).toBe( 'pending' );  // initial condition
				
				operation.abort();
				expect( operation.state() ).toBe( 'aborted' );
			} );
			
		} );
		
		
		describe( 'progress()', function() {
			var requests,
			    operation,
			    progressCallCount;
			
			beforeEach( function() {
				requests = [ new ReadRequest(), new ReadRequest() ];
				operation = new ConcreteOperation( { dataComponent: model, proxy: manualProxy, requests: requests } );
				
				progressCallCount = 0;
				operation.progress( function( dataComponent, op ) { 
					progressCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
			} );
			
			
			it( "should register a handler to be called when one of the Operation's Requests completes", function() {
				expect( progressCallCount ).toBe( 0 );  // initial condition
				
				operation.executeRequests();  // "begin" executing requests - sends them to the `manualProxy`
				
				manualProxy.resolveRead( 0 );
				expect( progressCallCount ).toBe( 1 );
				
				manualProxy.resolveRead( 1 );
				expect( progressCallCount ).toBe( 2 );
			} );
			
			
			it( "should register a handler to be called when the Proxy notifies of progress", function() {
				expect( progressCallCount ).toBe( 0 );  // initial condition
				
				operation.executeRequests();  // "begin" executing requests - sends them to the `manualProxy`
				
				manualProxy.notifyRead( 0 );
				expect( progressCallCount ).toBe( 1 );
				
				manualProxy.notifyRead( 1 );
				expect( progressCallCount ).toBe( 2 );
				
				// Now resolve the requests, which should each produce another 'progress' event
				manualProxy.resolveRead( 0 );
				expect( progressCallCount ).toBe( 3 );
				
				manualProxy.resolveRead( 1 );
				expect( progressCallCount ).toBe( 4 );
			} );
			
			
			it( "should register a handler to be called when one of the Operation's Requests completes, but the handler should not be called if the Request errors", function() {
				expect( progressCallCount ).toBe( 0 );  // initial condition
				
				operation.executeRequests();  // "begin" executing requests - sends them to the `manualProxy`
				
				manualProxy.resolveRead( 0 );
				expect( progressCallCount ).toBe( 1 );
				
				manualProxy.rejectRead( 1 );
				expect( progressCallCount ).toBe( 1 );  // should still be 1, since the 2nd request failed (errored)
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( operation.progress() ).toBe( operation );
			} );
			
		} );
		
		
		describe( 'done()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should register a handler to be called upon Operation success", function() {
				var doneCallCount = 0;
				
				operation.done( function( dataComponent, op ) { 
					doneCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.resolve();
				expect( doneCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( operation.done() ).toBe( operation );
			} );
			
		} );
		
		
		describe( 'fail()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
			
			it( "should register a handler to be called upon Operation error", function() {
				var errorCallCount = 0;
				
				operation.fail( function( dataComponent, op ) { 
					errorCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.reject();
				expect( errorCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( operation.fail() ).toBe( operation );
			} );
			
		} );
		
		
		describe( 'cancel()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
			} );
			
				    
			it( "should register a handler to be called if the Operation is aborted (canceled)", function() {
				var cancelCallCount = 0;
				
				operation.cancel( function( dataComponent, op ) { 
					cancelCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.abort();
				expect( cancelCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( operation.cancel() ).toBe( operation );
			} );
			
		} );
		
		
		describe( 'then()', function() {
			var request1,
			    request2,
			    operation,
			    localDoneCount,
			    localFailCount,
			    localProgressCount;
			
			beforeEach( function() {
				request1 = new ReadRequest();
				request2 = new ReadRequest();
				operation = new ConcreteOperation( { dataComponent: model, proxy: manualProxy, requests: [ request1, request2 ] } );
				
				localDoneCount = localFailCount = localProgressCount = 0;
				
				operation.then(
					function() { localDoneCount++; },
					function() { localFailCount++; },
					function() { localProgressCount++; }
				);
			} );
			
			
			it( "should register a `done` handler", function() {
				expect( localDoneCount ).toBe( 0 );  // initial condition
				
				operation.resolve();
				expect( localDoneCount ).toBe( 1 );
			} );
			
			
			it( "should register a `fail` handler", function() {
				expect( localFailCount ).toBe( 0 );  // initial condition
				
				operation.reject();
				expect( localFailCount ).toBe( 1 );
			} );
			
			
			it( "should register a `progress` handler", function() {
				expect( localProgressCount ).toBe( 0 );  // initial condition
				
				operation.executeRequests();  // "begin" executing requests - sends them to the `manualProxy`
				
				manualProxy.resolveRead( 0 );
				expect( localProgressCount ).toBe( 1 );
				
				manualProxy.resolveRead( 1 );
				expect( localProgressCount ).toBe( 2 );
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( operation.then() ).toBe( operation );
			} );
			
		} );
		
		
		describe( 'always()', function() {
			var operation,
			    alwaysCallCount;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } );
				
				alwaysCallCount = 0;
				operation.always( function( dataComponent, op ) { 
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
			} );
			
			
			it( "should register a handler to be called upon Operation success", function() {
				operation.resolve();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Operation error", function() {
				operation.reject();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Operation cancellation", function() {
				operation.abort();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( operation.always() ).toBe( operation );
			} );
			
		} );
		
		
		describe( "compatibility with jQuery.when()", function() {
			
			it( "should be allowed to be used as a single promise passed to jQuery.when()", function() {
				var operation = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    isDone = false;

				var masterPromise = jQuery.when( operation );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Attach a handler to make sure
				masterPromise.done( function() { isDone = true; } );
				
				operation.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
				expect( isDone ).toBe( true );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), only being resolved when all individual promises are resolved", function() {
				var operation1 = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    operation2 = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    operation3 = new ConcreteOperation( { dataComponent: model, proxy: proxy } );

				var masterPromise = jQuery.when( operation1, operation2, operation3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Resolve one at a time
				operation1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				operation2.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				operation3.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), being rejected if just one of the individual promises are rejected", function() {
				var operation1 = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    operation2 = new ConcreteOperation( { dataComponent: model, proxy: proxy } ),
				    operation3 = new ConcreteOperation( { dataComponent: model, proxy: proxy } );

				var masterPromise = jQuery.when( operation1, operation2, operation3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Resolve the first one
				operation1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				// Reject the second one
				operation2.reject();
				expect( masterPromise.state() ).toBe( 'rejected' );

				// Even if this third one is resolved, it should still be "rejected"
				operation3.resolve();
				expect( masterPromise.state() ).toBe( 'rejected' );
			} );
			
		} );
		
	} );
	
} );