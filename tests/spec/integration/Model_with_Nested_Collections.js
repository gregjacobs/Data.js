/*global define window, _, describe, beforeEach, afterEach, it, xit, expect, JsMockito */
define( [
	'Class',
	'data/Model',
	'data/Collection'
], function( Class, Model, Collection ) {
	
	describe( "Integration: Model with Nested Collections", function() {
		
		describe( "Test default nested Collection initialization", function() {
			
			xit( "A nested Collection attribute should default to be an empty collection", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name: 'nestedCollection', type: 'collection' }  // note: no specific defaultValue
					]
				} );
				var model = new MyModel();
				
				expect( model.get( 'nestedCollection' ) instanceof Collection ).toBe( true );  // orig YUI Test err msg: "The 'nestedCollection' should have been an instance of Collection"
				expect( model.get( 'nestedCollection' ).getCount() ).toBe( 0 );  // orig YUI Test err msg: "The 'nestedCollection' should be empty"
			} );
			
		} );
		
		
		describe( "Test setting nested Collections", function() {
			
			it( "set() should only change the attribute that a nested Collection is being set to if it is a different Collection than it already has", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name: 'nestedCollection', type: 'collection' }
					]
				} );
				var NestedCollection = Collection.extend( {} );
				
				var model = new MyModel();
				var nestedCollection1 = new NestedCollection();
				var nestedCollection2 = new NestedCollection();
				
				
				// Add event handlers to determine when actual "sets" have been done
				var setCount = 0;
				model.addListener( 'change:nestedCollection', function() { setCount++; } );
				
				// Add random subscriptions to nestedCollection events, just to make sure this doesn't cause an issue.
				// (Using the old method of simply deep comparing the old object and the new object, which was unaware of 
				// nested Models, this would cause a "maximum call stack size exceeded" error on set())
				nestedCollection1.on( 'add', function(){} );
				nestedCollection2.on( 'remove', function(){} );
				
				
				// Set for the first time
				model.set( 'nestedCollection', nestedCollection1 );
				expect( setCount ).toBe( 1 );  // orig YUI Test err msg: "The collection should have been set for the first time"
				
				// Now set the collection the second time. Should *not* fire a change event
				model.set( 'nestedCollection', nestedCollection1 );
				expect( setCount ).toBe( 1 );  // orig YUI Test err msg: "The collection should not have been re-set, because it is the same collection that is already there"
				
				
				// Set the second nestedCollection now
				model.set( 'nestedCollection', nestedCollection2 );
				expect( setCount ).toBe( 2 );  // orig YUI Test err msg: "The new collection (nestedCollection2) should have been set"
				
				// Now set the second model the second time. Should *not* fire a change event
				model.set( 'nestedCollection', nestedCollection2 );
				expect( setCount ).toBe( 2 );  // orig YUI Test err msg: "The new model (nestedModel2) should not have been re-set, because it is the same model that is already there"
				
				
				// Set to null, to make sure we accept collections again afterwards
				model.set( 'nestedCollection', null );
				expect( setCount ).toBe( 3 );  // orig YUI Test err msg: "The attribute should have been set to null"
				
				// Now set to a collection again
				model.set( 'nestedCollection', nestedCollection1 );
				expect( setCount ).toBe( 4 );  // orig YUI Test err msg: "The attribute should have been set to nestedCollection1 after it had been null"
			} );
			
		} );
		
		
		describe( "Test the 'change' event for nested collections", function() {
			
			xit( "When an attribute has changed in a model of a nested collection, its parent collection should fire the appropriate 'change' events", function() {
				var ChildModel = Model.extend( {
					attributes: [ 'attr' ],
					toString : function() { return "(ChildModel)"; }
				} );
				
				var MyCollection = Collection.extend( {
					model : ChildModel,
					toString : function() { return "(Collection)"; }
				} );
				
				var ParentModel = Model.extend( {
					attributes : [ { name: 'myCollection', type: 'Collection' } ],
					toString : function() { return "(ParentModel)"; }
				} );
				
				
				var childModel1 = new ChildModel( { attr: 'origValue1' } ),
				    childModel2 = new ChildModel( { attr: 'origValue2' } ),
				    collection = new MyCollection( [ childModel1, childModel2 ] ),
				    parentModel = new ParentModel( { myCollection: collection } );
				
				
				// A class to store the results
				var ChangeEventResults = Class.extend( Object, {
					constructor : function( model, attributeName, newValue, oldValue ) {
						this.model = model;
						this.attributeName = attributeName;
						this.newValue = newValue;
						this.oldValue = oldValue;
					}
				} );
				
				var CollectionChangeEventResults = ChangeEventResults.extend( {
					constructor : function( collection, model, attributeName, newValue, oldValue ) {
						this.collection = collection;
						this._super( [ model, attributeName, newValue, oldValue ] );
					}
				} );
				
				
				// 'change'
				var changeEventCallCount = 0,
				    changeEvent;
				
				parentModel.on( 'change', function( model, attributeName, newValue, oldValue ) {
					changeEventCallCount++;
					changeEvent = new ChangeEventResults( model, attributeName, newValue, oldValue );
				} );
				
				
				// 'change:myCollection'
				var attrSpecificChangeEventCallCount = 0,
				    attrSpecificChangeEvent;
				
				parentModel.on( 'change:myCollection', function( model, newValue, oldValue ) {
					attrSpecificChangeEventCallCount++;
					attrSpecificChangeEvent = new ChangeEventResults( model, '', newValue, oldValue );
				} );
				
				
				// 'change:myCollection.*'
				var attrSpecificChangeAttrEventCallCount = 0,
				    attrSpecificChangeAttrEvent;
				
				parentModel.on( 'change:myCollection.*', function( collection, model, attributeName, newValue, oldValue ) {
					attrSpecificChangeAttrEventCallCount++;
					attrSpecificChangeAttrEvent = new CollectionChangeEventResults( collection, model, attributeName, newValue, oldValue );
				} );
				
				
				childModel1.set( 'attr', 'newValue1' );
				
				// 'change'
				expect( changeEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The call count should now be exactly 1"
				expect( changeEvent.model ).toBe( parentModel );  // orig YUI Test err msg: "The event for childModel1 should have been fired with the parentModel"
				expect( changeEvent.attributeName ).toBe( 'myCollection' );  // orig YUI Test err msg: "The event for childModel1 should have been fired with the correct attribute name"
				expect( changeEvent.newValue ).toBe( collection );  // orig YUI Test err msg: "The event for childModel1 should have been fired with the newValue of the collection"
				expect( changeEvent.oldValue ).toBe( collection );  // orig YUI Test err msg: "The event for childModel1 should have been fired with the oldValue of the collection"
				
				// 'change:myCollection'
				expect( attrSpecificChangeEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The call count should now be exactly 1"
				expect( attrSpecificChangeEvent.model ).toBe( parentModel );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the parentModel"
				expect( attrSpecificChangeEvent.newValue ).toBe( collection );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the newValue of the collection"
				expect( attrSpecificChangeEvent.oldValue ).toBe( collection );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the oldValue of the collection"
				
				// 'change:myCollection.*'
				expect( attrSpecificChangeAttrEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The call count should now be exactly 1"
				expect( attrSpecificChangeAttrEvent.collection ).toBe( collection );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the collection"
				expect( attrSpecificChangeAttrEvent.model ).toBe( childModel1 );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the model that changed"
				expect( attrSpecificChangeAttrEvent.attributeName ).toBe( 'attr' );  // orig YUI Test err msg: "The event for childModel1 should have been fired with the correct attribute name"
				expect( attrSpecificChangeAttrEvent.newValue ).toBe( 'newValue1' );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the newValue"
				expect( attrSpecificChangeAttrEvent.oldValue ).toBe( 'origValue1' );  // orig YUI Test err msg: "The attribute-specific event for childModel1 should have been fired with the oldValue"
			} );
			
			
			xit( "The parent model should no longer fire events from the child collection after the child collection has been un-set from the parent", function() {
				var ChildModel = Model.extend( {
					attributes: [ 'attr' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : ChildModel
				} );
				
				var ParentModel = Model.extend( {
					attributes : [ { name: 'myCollection', type: 'collection' } ]
				} );
				
				var childModel1 = new ChildModel( { attr: 'origValue1' } ),
				    childModel2 = new ChildModel( { attr: 'origValue2' } ),
				    collection = new MyCollection( [ childModel1, childModel2 ] ),
				    parentModel = new ParentModel( { myCollection: collection } );
				
				var changeEventCallCount = 0;
				parentModel.on( 'change', function( model, attributeName, newValue, oldValue ) {
					changeEventCallCount++;
				} );
				
				// Set a value in a child model. We should get a change event.
				childModel1.set( 'attr', 'newValue1' );
				expect( changeEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The call count should now be 1 (as an initial test)"
				
				
				// Now, unset the child collection, and then set another attribute on a model within it. We should not get another change event.
				parentModel.set( 'myCollection', null );
				childModel1.set( 'attr', 'newNewValue1' );
				
				expect( changeEventCallCount ).toBe( 2 );  // orig YUI Test err msg: "We should now only have 2 for the event firing count, as we un-set the child model from the parent (which was the +1), but shouldn't get 3 from childModel1's event"
			} );
			
			
			xit( "When a child collection is added to / removed from / reordered, the parent model should fire a 'change' event", function() {
				var ParentModel = Model.extend( {
					attributes : [ { name: 'childCollection', type: 'collection' } ],
					
					toString : function() { return "(ParentModel)"; }  // for debugging
				} );
				
				var ChildModel = Model.extend( {
					attributes : [ { name : 'attr', type: 'string' } ],
					
					toString : function() { return "(ChildModel)"; }  // for debugging
				} );
				
				var MyCollection = Collection.extend( {
					model : ChildModel,
					
					toString : function() { return "(Collection)"; }  // for debugging
				} );
				
				
				var childModel1 = new ChildModel( { attr: 1 } ),
				    childModel2 = new ChildModel( { attr: 2 } ),
				    childModel3 = new ChildModel( { attr: 3 } ),  // not added to the collection initially
				    collection = new MyCollection( [ childModel1, childModel2 ] ),
				    parentModel = new ParentModel( { childCollection: collection } );
				
				
				var addSetEventCount = 0,
				    removeSetEventCount = 0,
				    reorderEventCount = 0;
				collection.on( 'addset', function() { addSetEventCount++; } );
				collection.on( 'removeset', function() { removeSetEventCount++; } );
				collection.on( 'reorder', function() { reorderEventCount++; } );
				
				
				var changeEventCount = 0,
				    collectionSpecificChangeEventCount = 0,
				    changeModel, changeAttr, changeNewVal, changeOldVal;
				    
				parentModel.on( 'change', function( model, attr, newVal, oldVal ) {
					changeEventCount++;
					changeModel = model; changeAttr = attr; changeNewVal = newVal; changeOldVal = oldVal;
				} );
				
				parentModel.on( 'change:childCollection', function( model, newVal, oldVal ) {
					collectionSpecificChangeEventCount++;
				} );
				
				expect( addSetEventCount ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: the addSetEventCount should be 0"
				expect( removeSetEventCount ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: the removeSetEventCount should be 0"
				expect( reorderEventCount ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: the reorderEventCount should be 0"
				expect( changeEventCount ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: the changeCount should be 0"
				expect( collectionSpecificChangeEventCount ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: the collectionSpecificChangeEventCount should be 0"
				
				
				collection.add( childModel3 );
				expect( addSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The addSetEventCount should now be 1"
				expect( removeSetEventCount ).toBe( 0 );  // orig YUI Test err msg: "The removeSetEventCount should still be 0"
				expect( reorderEventCount ).toBe( 0 );  // orig YUI Test err msg: "The reorderEventCount should still be 0"
				expect( changeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The changeEventCount should now be 1 after an 'add' event"
				expect( collectionSpecificChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The collectionSpecificChangeEventCount should now be 1 after an 'add' event"
				expect( changeModel ).toBe( parentModel );  // orig YUI Test err msg: "The changed model should be the parent model for an add event"
				expect( changeAttr ).toBe( 'childCollection' );  // orig YUI Test err msg: "The changed attribute should be the childCollection for an add event"
				expect( changeNewVal ).toBe( collection );  // orig YUI Test err msg: "The newValue for the change event should be the collection for an add event"
				expect( changeOldVal ).toBe( collection );  // orig YUI Test err msg: "The oldValue for the change event should be the collection for an add event"
				
				collection.remove( childModel3 );
				expect( addSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The addSetEventCount should still be 1"
				expect( removeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The removeSetEventCount should now be 1"
				expect( reorderEventCount ).toBe( 0 );  // orig YUI Test err msg: "The reorderEventCount should still be 0"
				expect( changeEventCount ).toBe( 2 );  // orig YUI Test err msg: "The changeEventCount should now be 2 after a 'remove' event"
				expect( collectionSpecificChangeEventCount ).toBe( 2 );  // orig YUI Test err msg: "The collectionSpecificChangeEventCount should now be 2 after an 'remove' event"
				expect( changeModel ).toBe( parentModel );  // orig YUI Test err msg: "The changed model should be the parent model for a remove event"
				expect( changeAttr ).toBe( 'childCollection' );  // orig YUI Test err msg: "The changed attribute should be the childCollection for a remove event"
				expect( changeNewVal ).toBe( collection );  // orig YUI Test err msg: "The newValue for the change event should be the collection for a remove event"
				expect( changeOldVal ).toBe( collection );  // orig YUI Test err msg: "The oldValue for the change event should be the collection for a remove event"
				
				collection.insert( childModel1, 1 );  // "reorder" childModel1 to the 2nd position
				expect( addSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The addSetEventCount should still be 1"
				expect( removeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The removeSetEventCount should still be 1"
				expect( reorderEventCount ).toBe( 1 );  // orig YUI Test err msg: "The reorderEventCount should now be 1"
				expect( changeEventCount ).toBe( 3 );  // orig YUI Test err msg: "The changeEventCount should now be 3 after a 'reorder' event"
				expect( collectionSpecificChangeEventCount ).toBe( 3 );  // orig YUI Test err msg: "The collectionSpecificChangeEventCount should now be 3 after an 'reorder' event"
				expect( changeModel ).toBe( parentModel );  // orig YUI Test err msg: "The changed model should be the parent model for a reorder event"
				expect( changeAttr ).toBe( 'childCollection' );  // orig YUI Test err msg: "The changed attribute should be the childCollection for a reorder event"
				expect( changeNewVal ).toBe( collection );  // orig YUI Test err msg: "The newValue for the change event should be the collection for a reorder event"
				expect( changeOldVal ).toBe( collection );  // orig YUI Test err msg: "The oldValue for the change event should be the collection for a reorder event"
			} );
			
		} );
		
		
		describe( "Test that the parent model \"has changes\" when an embedded collection is changed", function() {
			
			it( "The parent model should have changes when a child embedded collection has changes", function() {
				var ParentModel = Model.extend( {
					attributes : [
						{ name: 'myCollection', type: 'collection', embedded: true }
					]
				} );
				
				var ChildModel = Model.extend( {
					attributes : [
						{ name : 'attr', type: 'string' }
					]
				} );
				
				var MyCollection = Collection.extend( {
					model : ChildModel
				} );
				
				var collection = new MyCollection( [ { attr: 1 }, { attr: 2 } ] );
				var parentModel = new ParentModel( {
					myCollection: collection
				} );
				
				collection.getAt( 0 ).set( 'attr', 'newValue' );
				expect( parentModel.isModified() ).toBe( true );  // orig YUI Test err msg: "The parent model should be considered 'modified' while a model in its child collection is 'modified'"
				expect( parentModel.isModified( 'myCollection' ) ).toBe( true );  // orig YUI Test err msg: "The 'myCollection' attribute should be considered 'modified'"
			} );
			
			
			it( "The parent model should *not* have changes when a child collection has changes, but is not 'embedded'", function() {
				var ParentModel = Model.extend( {
					attributes : [
						{ name: 'myCollection', type: 'collection', embedded: false }
					]
				} );
				
				var ChildModel = Model.extend( {
					attributes : [
						{ name : 'attr', type: 'string' }
					]
				} );
				
				var MyCollection = Collection.extend( {
					model : ChildModel
				} );
				
				
				var collection = new MyCollection( [ { attr: 1 }, { attr: 2 } ] );
				var parentModel = new ParentModel( {
					myCollection: collection
				} );
				
				collection.getAt( 0 ).set( 'attr', 'newValue' );
				expect( parentModel.isModified() ).toBe( false );  // orig YUI Test err msg: "The parent model should not be considered 'modified' even though its child collection is 'modified', because the child is not 'embedded'"
			} );
			
		} );
		
	} );
} );