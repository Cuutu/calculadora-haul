import mongoose, { Document, Schema } from 'mongoose';
import { Product, ExchangeRates } from '../types';

export interface IHaul extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  products: Product[];
  exchangeRates: ExchangeRates;
  totalCost: number;
  totalWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema({
  id: { type: String, required: true },
  cantidad: { type: Number, required: true },
  producto: { type: String, required: true },
  peso: { type: Number, required: true },
  precioYuanes: { type: Number, required: true },
  precioUSD: { type: Number, required: true },
  precioARS: { type: Number, required: true },
  link: { type: String, required: false, default: '' },
}, { _id: false });

const ExchangeRatesSchema = new Schema({
  oficial: {
    compra: { type: Number, required: true },
    venta: { type: Number, required: true },
  },
  cripto: {
    compra: { type: Number, required: true },
    venta: { type: Number, required: true },
  },
}, { _id: false });

const HaulSchema = new Schema<IHaul>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Haul name is required'],
    trim: true,
  },
  products: [ProductSchema],
  exchangeRates: ExchangeRatesSchema,
  totalCost: {
    type: Number,
    required: true,
    default: 0,
  },
  totalWeight: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate totals before saving
HaulSchema.pre('save', function(next) {
  this.totalCost = this.products.reduce((sum, product) => sum + product.precioARS, 0);
  this.totalWeight = this.products.reduce((sum, product) => sum + (product.peso * product.cantidad), 0);
  next();
});

export default mongoose.models.Haul || mongoose.model<IHaul>('Haul', HaulSchema);
