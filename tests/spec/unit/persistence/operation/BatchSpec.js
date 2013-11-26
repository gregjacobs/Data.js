/*global define, window, describe, beforeEach, afterEach, it, xit, expect, spyOn */
define( [
	'data/persistence/operation/Batch',
	'data/persistence/operation/Operation',
	
	'data/Collection',      // Used as the `dataComponent` of the OperationBatches
	'data/Model',           // Used as the `dataComponent` of the Operations
	'spec/lib/ManualProxy'  // Used as the `proxy` of the Operations
], function( OperationBatch, Operation, Collection, Model, ManualProxy ) {
	
	describe( 'data.persistence.operationBatch.Batch', function() {
		
		// Concrete Subclasses
		var TestOperation;
		
		// Used as the `dataComponent` of the OperationBatches
		var collection;
		
		// Used as the `dataComponent` of the Operations
		var model;
		
		var manualProxy;
		
		beforeEach( function() {
			collection = new Collection();
			model = new Model();
			
			manualProxy = new ManualProxy();
			
			TestOperation = Operation.extend( {
				dataComponent: model,
				proxy: manualProxy
			} );
		} );
		
		
		describe( "configs", function() {
			
			it( "should throw an error if the `dataComponent` config is not provided", function() {
				expect( function() {
					var batch = new OperationBatch( { operations: [] } );
				} ).toThrow( "`dataComponent` cfg required" );
			} );
			
			
			it( "should throw an error if the `operations` config is not provided", function() {
				expect( function() {
					var batch = new OperationBatch( { dataComponent: new Collection() } );
				} ).toThrow( "`operations` cfg required" );
			} );
			
		} );
		
		
		describe( "deferred functionality", function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should call `progress` handlers when an individual Operation reports progress", function() {
				var progressCallCount = 0;
				
				operationBatch.progress( function( dataComponent, opBatch ) { 
					progressCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				operations[ 0 ].notify();
				expect( progressCallCount ).toBe( 1 );
				
				operations[ 0 ].notify();
				expect( progressCallCount ).toBe( 2 );
				
				operations[ 1 ].notify();
				expect( progressCallCount ).toBe( 3 );
			} );
			
			
			it( "should call `progress` handlers when an individual Operation completes successfully", function() {
				var progressCallCount = 0;
				
				operationBatch.progress( function( dataComponent, opBatch ) { 
					progressCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				operations[ 0 ].resolve();
				expect( progressCallCount ).toBe( 1 );
				
				operations[ 1 ].resolve();
				expect( progressCallCount ).toBe( 2 );
			} );
			
			
			it( "should call `done` handlers when all Operations have completed successfully", function() {
				var doneCallCount = 0;
				
				operationBatch.done( function( dataComponent, opBatch ) { 
					doneCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				operations[ 0 ].resolve();
				expect( doneCallCount ).toBe( 0 );
				
				operations[ 1 ].resolve();
				expect( doneCallCount ).toBe( 1 );
			} );
			
			
			it( "should call `fail` handlers when an individual Operation has failed (errored)", function() {
				var failCallCount = 0;
				
				operationBatch.fail( function( dataComponent, opBatch ) { 
					failCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				operations[ 0 ].reject();
				expect( failCallCount ).toBe( 1 );
				
				operations[ 1 ].reject();
				expect( failCallCount ).toBe( 1 );  // already failed, should still be 1
			} );
			
			
			it( "should call `cancel` handlers when the OperationBatch has been aborted (i.e. the `abort()` method was called)", function() {
				var cancelCallCount = 0;
				
				operationBatch.cancel( function( dataComponent, opBatch ) { 
					cancelCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				expect( cancelCallCount ).toBe( 0 );
				
				operationBatch.abort();
				expect( cancelCallCount ).toBe( 1 );
			} );
			
			
			it( "should call `always` handlers when the OperationBatch has completed", function() {
				var alwaysCallCount = 0;
				
				operationBatch.always( function( dataComponent, opBatch ) { 
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				operations[ 0 ].resolve();
				expect( alwaysCallCount ).toBe( 0 );
				
				operations[ 1 ].resolve();
				expect( alwaysCallCount ).toBe( 1 );
			} );
			
		} );
		
		
		describe( 'getOperations()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should return the operations provided to the OperationBatch constructor", function() {
				var ops = operationBatch.getOperations();
				expect( ops.length ).toBe( 2 );
				expect( ops[ 0 ] ).toBe( operations[ 0 ] );
				expect( ops[ 1 ] ).toBe( operations[ 1 ] );
			} );
			
		} );
		
		
		
		// -----------------------------------
		
		// OperationBatch's Deferred/State interface
		
		
		describe( 'notify()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should call `progress` handlers with the args: [ dataComponent, operationBatch ]", function() {
				var progressCallCount = 0;
				
				operationBatch.progress( function( dataComponent, opBatch ) { 
					progressCallCount++;
					
					expect( dataComponent ).toBe( collection );
					expect( opBatch ).toBe( operationBatch );
				} );
				
				operationBatch.notify();
				
				expect( progressCallCount ).toBe( 1 );
				expect( operationBatch.state() ).toBe( 'pending' );
				expect( operationBatch.wasSuccessful() ).toBe( false );
				expect( operationBatch.hasErrored() ).toBe( false );
				expect( operationBatch.wasAborted() ).toBe( false );
				expect( operationBatch.isComplete() ).toBe( false );
			} );
		} );
		
		
		describe( 'resolve()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should prevent the OperationBatch from becoming 'failed' after it has been resolved", function() {
				operationBatch.resolve();
				operationBatch.reject();  // attempt to reject, which should have been blocked
				
				expect( operationBatch.state() ).toBe( 'resolved' );
				expect( operationBatch.wasSuccessful() ).toBe( true );
				expect( operationBatch.hasErrored() ).toBe( false );
				expect( operationBatch.wasAborted() ).toBe( false );
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the OperationBatch from becoming 'aborted' after it has been resolved", function() {
				operationBatch.resolve();
				operationBatch.abort();  // attempt to abort, which should have been blocked
				
				expect( operationBatch.state() ).toBe( 'resolved' );
				expect( operationBatch.wasSuccessful() ).toBe( true );
				expect( operationBatch.hasErrored() ).toBe( false );
				expect( operationBatch.wasAborted() ).toBe( false );
				expect( operationBatch.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'reject()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should prevent the Operation from becoming 'successful' after it has been rejected", function() {
				operationBatch.reject();
				operationBatch.resolve();  // attempt to resolve, which should have been blocked
				
				expect( operationBatch.state() ).toBe( 'rejected' );
				expect( operationBatch.wasSuccessful() ).toBe( false );
				expect( operationBatch.hasErrored() ).toBe( true );
				expect( operationBatch.wasAborted() ).toBe( false );
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'aborted' after it has been rejected", function() {
				operationBatch.reject();
				operationBatch.abort();  // attempt to abort, which should have been blocked
				
				expect( operationBatch.state() ).toBe( 'rejected' );
				expect( operationBatch.wasSuccessful() ).toBe( false );
				expect( operationBatch.hasErrored() ).toBe( true );
				expect( operationBatch.wasAborted() ).toBe( false );
				expect( operationBatch.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'abort()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should prevent the Operation from becoming 'successful' after it has been aborted", function() {
				operationBatch.abort();
				operationBatch.resolve();  // attempt to resolve, which should have been blocked
				
				expect( operationBatch.state() ).toBe( 'aborted' );
				expect( operationBatch.wasSuccessful() ).toBe( false );
				expect( operationBatch.hasErrored() ).toBe( false );
				expect( operationBatch.wasAborted() ).toBe( true );
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been aborted", function() {
				operationBatch.abort();
				operationBatch.reject();  // attempt to reject, which should have been blocked
				
				expect( operationBatch.state() ).toBe( 'aborted' );
				expect( operationBatch.wasSuccessful() ).toBe( false );
				expect( operationBatch.hasErrored() ).toBe( false );
				expect( operationBatch.wasAborted() ).toBe( true );
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
			
			it( "should call `abort()` on each of the individual Operation objects", function() {
				expect( operations[ 0 ].wasAborted() ).toBe( false );  // initial condition
				expect( operations[ 1 ].wasAborted() ).toBe( false );  // initial condition
				
				operationBatch.abort();
				
				expect( operations[ 0 ].wasAborted() ).toBe( true );
				expect( operations[ 1 ].wasAborted() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'wasSuccessful()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operationBatch.wasSuccessful() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been resolved", function() {
				operationBatch.resolve();
				expect( operationBatch.wasSuccessful() ).toBe( true );
			} );
			
			it( "should return `false` after the Operation has been rejected", function() {
				operationBatch.reject();
				expect( operationBatch.wasSuccessful() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been aborted", function() {
				operationBatch.abort();
				expect( operationBatch.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'hasErrored()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operationBatch.hasErrored() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been resolved", function() {
				operationBatch.resolve();
				expect( operationBatch.hasErrored() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been rejected", function() {
				operationBatch.reject();
				expect( operationBatch.hasErrored() ).toBe( true );
			} );
			
			it( "should return `false` after the Operation has been aborted", function() {
				operationBatch.abort();
				expect( operationBatch.hasErrored() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'wasAborted()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operationBatch.wasAborted() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been resolved", function() {
				operationBatch.resolve();
				expect( operationBatch.wasAborted() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been rejected", function() {
				operationBatch.reject();
				expect( operationBatch.wasAborted() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been aborted", function() {
				operationBatch.abort();
				expect( operationBatch.wasAborted() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'isComplete()', function() {
			var operationBatch,
			    operations;
			
			beforeEach( function() {
				operations = [ new TestOperation(), new TestOperation() ];
				
				operationBatch = new OperationBatch( { dataComponent: collection, operations: operations } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operationBatch.isComplete() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been resolved", function() {
				operationBatch.resolve();
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
			it( "should return `true` after the Operation has been rejected", function() {
				operationBatch.reject();
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
			it( "should return `true` after the Operation has been aborted", function() {
				operationBatch.abort();
				expect( operationBatch.isComplete() ).toBe( true );
			} );
			
		} );
		
	} );
	
} );