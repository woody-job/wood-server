import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationException } from 'src/exceptions/validation.exception';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const obj = plainToInstance(metadata.metatype, value);

    if (typeof obj !== 'object') {
      return value;
    }

    const errors = await validate(obj);

    if (!errors.length) {
      return value;
    }

    const output = {};

    errors.forEach((error) => {
      output[`${error.property}`] = Object.values(error.constraints);
    });

    throw new ValidationException(output);
  }
}
