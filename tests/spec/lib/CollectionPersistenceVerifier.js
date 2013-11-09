/*global define, expect */
define( [
	'lodash',
	
	'data/Collection',
	'spec/lib/PersistenceVerifier',
	
	'data/persistence/operation/Load',
	'data/persistence/operation/Save'
], function( _, Collection, PersistenceVerifier, LoadOperation, SaveOperation ) {
	
	/**
	 * @class spec.lib.CollectionPersistenceVerifier
	 * @extends spec.lib.PersistenceVerifier
	 * 
	 * A helper fixture for testing the persistence features of {@link data.Collection Collections}.
	 * 
	 * This fixture is used to help test the {@link data.Collection#load load} and {@link data.Collection#sync sync} 
	 * methods, by checking that all of the events, options-provided callbacks, and promise handler callbacks have been 
	 * properly executed by the source code. It also makes sure that all callbacks/handlers are passed the correct arguments.
	 * 
	 * 
	 * ## Usage
	 * 
	 * When instantiated, a {@link data.Collection} must be passed in as the {@link #collection} config. From there, the
	 * {@link #execute} method should be executed with the method name (such as 'load', 'loadPage', 'sync', etc.) 
	 * to start the test.
	 * 
	 * When the collection's {@link data.Collection#proxy proxy} is complete, execute the {@link #verify} method to verify
	 * that the appropriate events/callbacks/handlers have been called.
	 * 
	 * 
	 * ## Example
	 * 
	 *     require( [
	 *         'data/Model',
	 *         'data/Collection',
	 *         
	 *         'spec/lib/ManualProxy',
	 *         'spec/lib/CollectionPersistenceVerifier'
	 *     ], function( Model, Collection, ManualProxy, CollectionPersistenceVerifier ) {
	 *     
	 *         describe( "data.Collection", function() {
	 *         
	 *             it( "should load data and fire all of the appropriate callbacks", function() {
	 *                 var MyModel = new Model( {
	 *                     attributes : [ 'id', 'attr' ]
	 *                 } );
	 *             
	 *                 // These two statements would probably go in a beforeEach()
	 *                 var manualProxy = new ManualProxy();
	 *                 var ManualProxyCollection = Collection.extend( {
	 *                     model : MyModel,
	 *                     proxy : manualProxy
	 *                 } );
	 *                 
	 *                 
	 *                 var collection = new ManualProxyCollection(),
	 *                     collectionPersistenceVerifier = new CollectionPersistenceVerifier( { collection: collection } );
	 *                 
	 *                 collectionPersistenceVerifier.execute( 'load' );
	 *                 
	 *                 manualProxy.resolveRead( 0, [ { id: 1, attr: "abc" } ] );  // Resolve the "read" request that the load operation performed (the first 'read' request), and 
	 *                 collectionPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called - executes Jasmine expect() statements
	 *             } );
	 *             
	 *         } );
	 *         
	 *     } );
	 */
	var CollectionPersistenceVerifier = PersistenceVerifier.extend( {
		
		/**
		 * @cfg {data.Collection} collection (required)
		 * 
		 * The Collection instance which is to be tested. The persistence method will be executed
		 * on this collection via the {@link #execute} method.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, specified in an Object (map)
		 */
		constructor : function( cfg ) {
			this._super( arguments );
			
			// Check required configs
			if( !this.collection || !( this.collection instanceof Collection ) ) throw new Error( "`collection` cfg required, and must be a data.Collection instance" );
		},
		
		
		/**
		 * Implementation of abstract method from superclass, which returns the {@link #collection} as the data component
		 * under test.
		 * 
		 * @protected
		 * @return {data.Collection} The Collection to use for the test.
		 */
		getDataComponent : function() {
			return this.collection;
		},
		
		
		/**
		 * Implementation of abstract method from superclass, which returns the appropriate 
		 * {@link data.persistence.operation.Operation} class which is expected, based on the input `methodName`.
		 * 
		 * @protected
		 * @return {data.Collection} The Collection to use for the test.
		 */
		getOperationClass : function( methodName ) {
			switch( methodName ) {
				case 'load' : case 'loadPage' : case 'loadRange' : case 'loadPageRange' : 
					return LoadOperation;
				case 'sync' :
					return SaveOperation;
				
				default : throw new Error( "unhandled case" );
			}
		},
		
		
		/**
		 * Override of superclass method used to map the {@link data.Collection#loadPage loadPage}, 
		 * {@link data.Collection#loadRange loadRange}, and {@link data.Collection#loadPageRange loadPageRange} methods
		 * to the 'load' event.
		 * 
		 * @protected
		 * @method getEventName
		 * @param {String} methodName The name of the method under test.
		 * @return {String} The event name to monitor for the method under test.
		 */
		getEventName : function( methodName ) {
			// First 4 chars of the method name === 'load', return just that. (ex: load(), loadPage(), loadRange(), loadPageRange())
			return ( methodName.substring( 0, 4 ) === 'load' ) ? 'load' : this._super( arguments );
		},
		
		
		/**
		 * Implementation of abstract hook method, used to check the argument provided to {@link #execute}, and
		 * that the initial state of the {@link #collection} is correct.
		 * 
		 * @protected
		 * @param {String} methodName The name of the method that will be called on the {@link #collection}. 
		 */
		onBeforeExecute : function( methodName ) {
			var methodNames = [ 'load', 'loadPage', 'loadRange', 'loadPageRange', 'sync' ];
			if( !_.contains( methodNames, methodName ) )
				throw new Error( "`methodName` arg must be one of: '" + methodNames.join( "', '" ) + "'" );
			
			// Check the initial state of the collection before the persistence method is called
			var collection = this.collection;
			expect( collection.isLoading() ).toBe( false );
			//expect( collection.isSynchronizing() ).toBe( false );
		},
		
		
		/**
		 * Implementation of abstract hook method, used to check that the state of the {@link #collection} is correct
		 * after calling the method ('load', 'save', or 'destroy').
		 * 
		 * @protected
		 * @param {String} methodName The name of the method that will be called on the {@link #collection}. 
		 */
		onAfterExecute : function( methodName ) {
			var collection = this.collection,
			    isLoadMethod = ( methodName.substring( 0, 4 ) === 'load' );  // handles 'load', 'loadPage', 'loadRange', and 'loadPageRange'
			
			expect( collection.isLoading() ).toBe( isLoadMethod ? true : false );
			//expect( collection.isSynchronizing() ).toBe( methodName === 'sync' ? true : false );
		},
		
		
		/**
		 * Implementation of abstract hook method, used to check that the state of the {@link #collection} is correct
		 * after the persistence operation has completed.
		 * 
		 * @protected
		 * @param {String} expectedOutcome The expected outcome after the persistence operation ('load', 'save', or 'destroy')
		 * has been completed. Will be one of: 'success', 'error', or 'cancel'.
		 */
		onVerify : function( expectedOutcome ) {
			var collection = this.collection;
			expect( collection.isLoading() ).toBe( false );
			//expect( collection.isSynchronizing() ).toBe( false );
		}
	
	} );
	
	
	return CollectionPersistenceVerifier;
	
} );